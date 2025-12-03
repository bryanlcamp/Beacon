/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges  
 * Purpose:      NASDAQ OUCH protocol execution data serializer implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/NasdaqOuchSerializer.h>
#include <cstring>
#include <stdexcept>
#include <iostream>

namespace beacon::exchanges::serializers {

NasdaqOuchSerializer::NasdaqOuchSerializer(const std::string& OutputPath)
    : OutputPath(OutputPath)
    , OutputFile(OutputPath, std::ios::binary) {
    
    if (!OutputFile) {
        throw std::runtime_error("Failed to open NASDAQ OUCH output file: " + OutputPath);
    }
}

NasdaqOuchSerializer::~NasdaqOuchSerializer() {
    if (OutputFile.is_open()) {
        Flush();
        OutputFile.close();
    }
}

void NasdaqOuchSerializer::Serialize(const ExecutionDataMessage& Message) {
    NasdaqOuchMessage ouchMsg = ConvertToOuchMessage(Message);
    SerializeOuchMessage(ouchMsg);
}

std::unique_ptr<ExecutionDataMessage> NasdaqOuchSerializer::Deserialize(const char* Data, size_t Size) {
    if (Size < OUCH_MESSAGE_SIZE) {
        return nullptr;
    }
    
    auto ouchMsg = ParseOuchMessage(Data, Size);
    if (!ouchMsg) {
        return nullptr;
    }
    
    // Convert OUCH message back to generic ExecutionDataMessage
    auto execMsg = std::make_unique<ExecutionDataMessage>();
    execMsg->OrderId = std::to_string(ouchMsg->Token);
    execMsg->ClientOrderId = std::to_string(ouchMsg->OrderReferenceNumber);
    execMsg->Symbol = std::string(ouchMsg->Stock, 8);
    execMsg->Side = (ouchMsg->BuySellIndicator == 'B') ? "Buy" : "Sell";
    execMsg->Price = static_cast<double>(ouchMsg->Price) / 10000.0;
    execMsg->Quantity = ouchMsg->Shares;
    execMsg->FilledQuantity = ouchMsg->ExecutedShares;
    execMsg->RemainingQuantity = ouchMsg->Shares - ouchMsg->ExecutedShares;
    
    // Map OUCH message types to execution types
    switch (ouchMsg->MessageType) {
        case MSG_TYPE_ORDER_ENTERED:
            execMsg->ExecType = "New";
            break;
        case MSG_TYPE_ORDER_EXECUTED:
            execMsg->ExecType = (ouchMsg->ExecutedShares == ouchMsg->Shares) ? "Fill" : "PartialFill";
            break;
        case MSG_TYPE_ORDER_CANCELED:
            execMsg->ExecType = "Canceled";
            break;
        case MSG_TYPE_ORDER_REPLACED:
            execMsg->ExecType = "Replace";
            break;
        case MSG_TYPE_REJECT:
            execMsg->ExecType = "Reject";
            break;
        default:
            execMsg->ExecType = "Unknown";
    }
    
    return execMsg;
}

ExchangeType NasdaqOuchSerializer::GetExchangeType() const {
    return ExchangeType::NASDAQ;
}

void NasdaqOuchSerializer::Flush() {
    if (OutputFile.is_open()) {
        OutputFile.flush();
    }
}

NasdaqOuchMessage NasdaqOuchSerializer::ConvertToOuchMessage(const ExecutionDataMessage& Message) {
    NasdaqOuchMessage ouchMsg{};
    
    // Determine message type based on execution type
    if (Message.ExecType == "New") {
        ouchMsg.MessageType = MSG_TYPE_ORDER_ENTERED;
    } else if (Message.ExecType == "Fill" || Message.ExecType == "PartialFill") {
        ouchMsg.MessageType = MSG_TYPE_ORDER_EXECUTED;
    } else if (Message.ExecType == "Canceled") {
        ouchMsg.MessageType = MSG_TYPE_ORDER_CANCELED;
    } else if (Message.ExecType == "Replace") {
        ouchMsg.MessageType = MSG_TYPE_ORDER_REPLACED;
    } else if (Message.ExecType == "Reject") {
        ouchMsg.MessageType = MSG_TYPE_REJECT;
    } else {
        ouchMsg.MessageType = MSG_TYPE_ORDER_ENTERED; // Default
    }
    
    // Convert fields
    ouchMsg.Token = std::stoull(Message.OrderId);
    ouchMsg.BuySellIndicator = (Message.Side == "Buy") ? 'B' : 'S';
    ouchMsg.Shares = Message.Quantity;
    
    // Copy symbol (pad with spaces)
    std::memset(ouchMsg.Stock.data(), ' ', 8);
    std::memcpy(ouchMsg.Stock.data(), Message.Symbol.c_str(), 
                std::min(Message.Symbol.size(), size_t(8)));
    
    // Convert price to OUCH format (10000ths)
    ouchMsg.Price = static_cast<uint32_t>(Message.Price * 10000.0);
    
    ouchMsg.OrderReferenceNumber = std::stoull(Message.ClientOrderId);
    ouchMsg.ExecutedShares = Message.FilledQuantity;
    ouchMsg.ExecutionPrice = static_cast<uint32_t>(Message.Price * 10000.0);
    
    // Set default values for OUCH-specific fields
    ouchMsg.TimeInForce = 0; // Day order
    ouchMsg.Display = 'Y';   // Displayable
    ouchMsg.Capacity = 0;    // Agency
    ouchMsg.IntermarketSweepEligibility = 'N';
    ouchMsg.MinimumQuantity = 0;
    ouchMsg.CrossType = 'N'; // No cross
    ouchMsg.LiquidityFlag = ' ';
    
    return ouchMsg;
}

void NasdaqOuchSerializer::SerializeOuchMessage(const NasdaqOuchMessage& OuchMsg) {
    // OUCH uses fixed-length binary messages
    // This is a simplified implementation - real OUCH has specific message layouts per type
    
    struct OuchBinaryMessage {
        char messageType;
        uint64_t token;
        char buySellIndicator;
        uint32_t shares;
        char stock[8];
        uint32_t price;
        uint32_t timeInForce;
        char display;
        uint64_t capacity;
        char intermarketSweepEligibility;
        uint32_t minimumQuantity;
        char crossType;
        uint64_t orderReferenceNumber;
        char liquidityFlag;
        uint32_t executedShares;
        uint32_t executionPrice;
        uint64_t matchNumber;
    } __attribute__((packed));
    
    OuchBinaryMessage binaryMsg{};
    binaryMsg.messageType = OuchMsg.MessageType;
    binaryMsg.token = OuchMsg.Token;
    binaryMsg.buySellIndicator = OuchMsg.BuySellIndicator;
    binaryMsg.shares = OuchMsg.Shares;
    std::memcpy(binaryMsg.stock, OuchMsg.Stock.data(), 8);
    binaryMsg.price = OuchMsg.Price;
    binaryMsg.timeInForce = OuchMsg.TimeInForce;
    binaryMsg.display = OuchMsg.Display;
    binaryMsg.capacity = OuchMsg.Capacity;
    binaryMsg.intermarketSweepEligibility = OuchMsg.IntermarketSweepEligibility;
    binaryMsg.minimumQuantity = OuchMsg.MinimumQuantity;
    binaryMsg.crossType = OuchMsg.CrossType;
    binaryMsg.orderReferenceNumber = OuchMsg.OrderReferenceNumber;
    binaryMsg.liquidityFlag = OuchMsg.LiquidityFlag;
    binaryMsg.executedShares = OuchMsg.ExecutedShares;
    binaryMsg.executionPrice = OuchMsg.ExecutionPrice;
    binaryMsg.matchNumber = OuchMsg.MatchNumber;
    
    OutputFile.write(reinterpret_cast<const char*>(&binaryMsg), sizeof(binaryMsg));
}

std::unique_ptr<NasdaqOuchMessage> NasdaqOuchSerializer::ParseOuchMessage(const char* Data, size_t Size) {
    if (Size < sizeof(char)) {
        return nullptr;
    }
    
    auto ouchMsg = std::make_unique<NasdaqOuchMessage>();
    
    // Parse message type first
    ouchMsg->MessageType = Data[0];
    
    // This is simplified - real OUCH parsing would be message-type specific
    // Each message type has different fields and layouts
    
    if (Size >= sizeof(uint64_t) + 1) {
        std::memcpy(&ouchMsg->Token, Data + 1, sizeof(uint64_t));
    }
    
    return ouchMsg;
}

void NasdaqOuchSerializer::SerializeOrderEntry(const ExecutionDataMessage& Message) {
    auto ouchMsg = ConvertToOuchMessage(Message);
    ouchMsg.MessageType = MSG_TYPE_ORDER_ENTERED;
    SerializeOuchMessage(ouchMsg);
}

void NasdaqOuchSerializer::SerializeOrderCancel(const ExecutionDataMessage& Message) {
    auto ouchMsg = ConvertToOuchMessage(Message);
    ouchMsg.MessageType = MSG_TYPE_ORDER_CANCELED;
    SerializeOuchMessage(ouchMsg);
}

void NasdaqOuchSerializer::SerializeOrderReplace(const ExecutionDataMessage& Message) {
    auto ouchMsg = ConvertToOuchMessage(Message);
    ouchMsg.MessageType = MSG_TYPE_ORDER_REPLACED;
    SerializeOuchMessage(ouchMsg);
}

} // namespace beacon::exchanges::serializers