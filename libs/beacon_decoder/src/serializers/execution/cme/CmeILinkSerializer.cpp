/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges  
 * Purpose:      CME iLink protocol execution data serializer implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/CmeILinkSerializer.h>
#include <cstring>
#include <stdexcept>
#include <iostream>

namespace beacon::exchanges::serializers {

CmeILinkSerializer::CmeILinkSerializer(const std::string& OutputPath)
    : OutputPath(OutputPath)
    , OutputFile(OutputPath, std::ios::binary)
    , MessageCount(0) {
    
    if (!OutputFile) {
        throw std::runtime_error("Failed to open CME iLink output file: " + OutputPath);
    }
}

CmeILinkSerializer::~CmeILinkSerializer() {
    if (OutputFile.is_open()) {
        Flush();
        OutputFile.close();
    }
}

void CmeILinkSerializer::Serialize(const ExecutionDataMessage& Message) {
    // Route to appropriate serialization method based on execution type
    if (Message.ExecType == "New") {
        SerializeNewOrder(Message);
    } else if (Message.ExecType == "Fill" || Message.ExecType == "PartialFill") {
        SerializeExecutionReport(Message);
    } else if (Message.ExecType == "Canceled") {
        SerializeOrderCancel(Message);
    } else if (Message.ExecType == "Replace") {
        SerializeOrderReplace(Message);
    } else {
        // Default to execution report
        SerializeExecutionReport(Message);
    }
    
    MessageCount++;
    
    // Flush every 1000 messages for CME
    if (MessageCount % 1000 == 0) {
        Flush();
    }
}

std::unique_ptr<ExecutionDataMessage> CmeILinkSerializer::Deserialize(const char* Data, size_t Size) {
    if (Size < CME_ORDER_MESSAGE_SIZE && Size < CME_EXEC_MESSAGE_SIZE) {
        return nullptr;
    }
    
    // Determine message type (simplified - real iLink uses message headers)
    char msgType = Data[0];
    
    auto execMsg = std::make_unique<ExecutionDataMessage>();
    
    if (Size >= CME_ORDER_MESSAGE_SIZE) {
        // Try parsing as order entry message
        auto orderMsg = ParseOrderEntryMessage(Data, Size);
        if (orderMsg) {
            execMsg->ClientOrderId = std::to_string(orderMsg->clientOrderId);
            execMsg->Symbol = std::string(orderMsg->symbol, 8);
            execMsg->Side = (orderMsg->side == 'B') ? "Buy" : "Sell";
            execMsg->Quantity = orderMsg->quantity;
            execMsg->Price = cmeFormatToPrice(orderMsg->price);
            
            // Map order type
            switch (orderMsg->orderType) {
                case 'L': execMsg->OrderType = "Limit"; break;
                case 'M': execMsg->OrderType = "Market"; break;
                case 'S': execMsg->OrderType = "Stop"; break;
                default: execMsg->OrderType = "Unknown"; break;
            }
            
            execMsg->ExecType = "New";
            return execMsg;
        }
    }
    
    if (Size >= CME_EXEC_MESSAGE_SIZE) {
        // Try parsing as execution report
        auto execReport = ParseExecutionReport(Data, Size);
        if (execReport) {
            execMsg->OrderId = std::to_string(execReport->orderID);
            execMsg->ClientOrderId = std::to_string(execReport->clientOrderId);
            execMsg->Symbol = std::string(execReport->symbol, 8);
            execMsg->Side = (execReport->side == 'B') ? "Buy" : "Sell";
            execMsg->Price = cmeFormatToPrice(execReport->executionPrice);
            execMsg->FilledQuantity = execReport->executedQty;
            execMsg->RemainingQuantity = execReport->leavesQty;
            execMsg->TransactionTime = execReport->transactTime;
            
            // Map execution type
            switch (execReport->execType) {
                case EXEC_TYPE_FILL:
                    execMsg->ExecType = (execReport->leavesQty == 0) ? "Fill" : "PartialFill";
                    break;
                case EXEC_TYPE_CANCEL:
                    execMsg->ExecType = "Canceled";
                    break;
                case EXEC_TYPE_REPLACE:
                    execMsg->ExecType = "Replace";
                    break;
                case EXEC_TYPE_REJECT:
                    execMsg->ExecType = "Reject";
                    execMsg->RejectReason = std::string(execReport->rejectReason, 16);
                    break;
                default:
                    execMsg->ExecType = "Unknown";
            }
            
            return execMsg;
        }
    }
    
    return nullptr;
}

ExchangeType CmeILinkSerializer::GetExchangeType() const {
    return ExchangeType::CME;
}

void CmeILinkSerializer::Flush() {
    if (OutputFile.is_open()) {
        OutputFile.flush();
    }
}

CmeOrderEntryMessage CmeILinkSerializer::ConvertToOrderEntry(const ExecutionDataMessage& Message) {
    CmeOrderEntryMessage orderMsg{};
    
    orderMsg.clientOrderId = std::stoull(Message.ClientOrderId);
    
    // Copy symbol and pad with spaces
    std::memset(orderMsg.symbol, ' ', sizeof(orderMsg.symbol));
    std::memcpy(orderMsg.symbol, Message.Symbol.c_str(), 
                std::min(Message.Symbol.size(), sizeof(orderMsg.symbol)));
    
    orderMsg.quantity = Message.Quantity;
    orderMsg.price = priceToCmeFormat(Message.Price);
    orderMsg.side = (Message.Side == "Buy") ? 'B' : 'S';
    
    // Map order type
    if (Message.OrderType == "Market") {
        orderMsg.orderType = 'M';
    } else if (Message.OrderType == "Limit") {
        orderMsg.orderType = 'L';
    } else if (Message.OrderType == "Stop") {
        orderMsg.orderType = 'S';
    } else {
        orderMsg.orderType = 'L'; // Default to limit
    }
    
    // Set default values
    orderMsg.tif = '0';      // Day order
    orderMsg.reserved1 = 0;  // Reserved field
    orderMsg.reserved2 = 0;  // Reserved field
    
    // Zero out padding
    std::memset(orderMsg._padding, 0, sizeof(orderMsg._padding));
    
    return orderMsg;
}

CmeExecutionReport CmeILinkSerializer::ConvertToExecutionReport(const ExecutionDataMessage& Message) {
    CmeExecutionReport execReport{};
    
    execReport.orderID = std::stoull(Message.OrderId);
    execReport.clientOrderId = std::stoull(Message.ClientOrderId);
    
    // Map execution type
    if (Message.ExecType == "Fill") {
        execReport.execType = EXEC_TYPE_FILL;
    } else if (Message.ExecType == "PartialFill") {
        execReport.execType = EXEC_TYPE_PARTIAL;
    } else if (Message.ExecType == "Canceled") {
        execReport.execType = EXEC_TYPE_CANCEL;
    } else if (Message.ExecType == "Replace") {
        execReport.execType = EXEC_TYPE_REPLACE;
    } else if (Message.ExecType == "Reject") {
        execReport.execType = EXEC_TYPE_REJECT;
    } else {
        execReport.execType = EXEC_TYPE_FILL; // Default
    }
    
    execReport.executedQty = Message.FilledQuantity;
    execReport.executionPrice = priceToCmeFormat(Message.Price);
    execReport.leavesQty = Message.RemainingQuantity;
    execReport.transactTime = Message.TransactionTime;
    
    // Copy symbol and pad with spaces
    std::memset(execReport.symbol, ' ', sizeof(execReport.symbol));
    std::memcpy(execReport.symbol, Message.Symbol.c_str(),
                std::min(Message.Symbol.size(), sizeof(execReport.symbol)));
    
    execReport.side = (Message.Side == "Buy") ? 'B' : 'S';
    execReport.matchNumber = Message.SequenceNumber; // Use sequence as match number
    
    // Copy reject reason if applicable
    std::memset(execReport.rejectReason, 0, sizeof(execReport.rejectReason));
    if (!Message.RejectReason.empty()) {
        std::memcpy(execReport.rejectReason, Message.RejectReason.c_str(),
                    std::min(Message.RejectReason.size(), sizeof(execReport.rejectReason)));
    }
    
    // Zero out padding
    std::memset(execReport._padding, 0, sizeof(execReport._padding));
    
    return execReport;
}

void CmeILinkSerializer::SerializeCmeOrderEntry(const CmeOrderEntryMessage& OrderMsg) {
    OutputFile.write(reinterpret_cast<const char*>(&OrderMsg), sizeof(OrderMsg));
}

void CmeILinkSerializer::SerializeCmeExecutionReport(const CmeExecutionReport& ExecMsg) {
    OutputFile.write(reinterpret_cast<const char*>(&ExecMsg), sizeof(ExecMsg));
}

std::unique_ptr<CmeOrderEntryMessage> CmeILinkSerializer::ParseOrderEntryMessage(const char* Data, size_t Size) {
    if (Size < sizeof(CmeOrderEntryMessage)) {
        return nullptr;
    }
    
    auto orderMsg = std::make_unique<CmeOrderEntryMessage>();
    std::memcpy(orderMsg.get(), Data, sizeof(CmeOrderEntryMessage));
    return orderMsg;
}

std::unique_ptr<CmeExecutionReport> CmeILinkSerializer::ParseExecutionReport(const char* Data, size_t Size) {
    if (Size < sizeof(CmeExecutionReport)) {
        return nullptr;
    }
    
    auto execReport = std::make_unique<CmeExecutionReport>();
    std::memcpy(execReport.get(), Data, sizeof(CmeExecutionReport));
    return execReport;
}

uint32_t CmeILinkSerializer::priceToCmeFormat(double price) const {
    // CME uses price in 1/10000 dollars (4 decimal places)
    return static_cast<uint32_t>(price * 10000.0);
}

double CmeILinkSerializer::cmeFormatToPrice(uint32_t cmePrice) const {
    return static_cast<double>(cmePrice) / 10000.0;
}

void CmeILinkSerializer::SerializeNewOrder(const ExecutionDataMessage& Message) {
    CmeOrderEntryMessage orderMsg = ConvertToOrderEntry(Message);
    SerializeCmeOrderEntry(orderMsg);
}

void CmeILinkSerializer::SerializeOrderCancel(const ExecutionDataMessage& Message) {
    CmeExecutionReport execReport = ConvertToExecutionReport(Message);
    execReport.execType = EXEC_TYPE_CANCEL;
    SerializeCmeExecutionReport(execReport);
}

void CmeILinkSerializer::SerializeOrderReplace(const ExecutionDataMessage& Message) {
    CmeExecutionReport execReport = ConvertToExecutionReport(Message);
    execReport.execType = EXEC_TYPE_REPLACE;
    SerializeCmeExecutionReport(execReport);
}

void CmeILinkSerializer::SerializeExecutionReport(const ExecutionDataMessage& Message) {
    CmeExecutionReport execReport = ConvertToExecutionReport(Message);
    SerializeCmeExecutionReport(execReport);
}

} // namespace beacon::exchanges::serializers