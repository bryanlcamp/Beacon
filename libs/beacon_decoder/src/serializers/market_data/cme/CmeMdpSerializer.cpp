/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      CME MDP serializer implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/CmeMdpSerializer.h>
#include <cstring>
#include <stdexcept>
#include <vector>

// SIMPLIFIED PROTOCOL STRUCTURES - no more complex protocol dependencies
namespace {
    struct MdpMessage {
        char messageType;
        uint64_t timestamp;
        char symbol[8];
        uint32_t price;
        uint32_t quantity;
        uint32_t sequenceNumber;
    } __attribute__((packed));
}

namespace beacon::exchanges::serializers {

CmeMdpSerializer::CmeMdpSerializer(const std::string& outputPath)
    : _outputPath(outputPath)
    , _outputFile(outputPath, std::ios::binary)
    , _messageCount(0) {
    
    if (!_outputFile) {
        throw std::runtime_error("Failed to open CME MDP output file: " + _outputPath);
    }
}

CmeMdpSerializer::~CmeMdpSerializer() {
    if (_outputFile.is_open()) {
        Flush();
        _outputFile.close();
    }
}

void CmeMdpSerializer::Serialize(const MarketDataMessage& Message) {
    SerializeMarketDataOrder(Message);
    _messageCount++;
    
    // Flush every 500 messages for CME
    if (_messageCount % 500 == 0) {
        Flush();
    }
}

void CmeMdpSerializer::SerializeMarketDataOrder(const MarketDataMessage& Message) {
    // TODO: Implement actual CME MDP 3.0 message structure
    // This is a placeholder implementation
    
    struct CmeMdoMessage {
        uint64_t sequenceNumber;
        char symbol[8];
        char side;
        uint32_t quantity;
        int64_t price;
        uint64_t timestamp;
    } __attribute__((packed));
    
    CmeMdoMessage cmeMsg{};
    cmeMsg.sequenceNumber = Message.SequenceNumber;
    
    // Copy symbol (pad with null bytes)
    std::memset(cmeMsg.symbol, 0, sizeof(cmeMsg.symbol));
    std::memcpy(cmeMsg.symbol, Message.Symbol.c_str(),
                std::min(Message.Symbol.size(), sizeof(cmeMsg.symbol) - 1));
    
    cmeMsg.side = (Message.Type == "Buy") ? 'B' : 'S';
    cmeMsg.quantity = static_cast<uint32_t>(Message.Quantity);
    cmeMsg.price = priceToCmeFormat(Message.Price);
    cmeMsg.timestamp = Message.Timestamp;
    
    _outputFile.write(reinterpret_cast<const char*>(&cmeMsg), sizeof(cmeMsg));
}

std::unique_ptr<MarketDataMessage> CmeMdpSerializer::Deserialize(const char* Data, size_t Size) {
    // TODO: Implement CME MDP deserialization
    return nullptr;
}

void CmeMdpSerializer::Flush() {
    if (_outputFile.is_open()) {
        _outputFile.flush();
    }
}

int64_t CmeMdpSerializer::priceToCmeFormat(double price) const {
    // CME uses tick-based pricing - this is simplified
    // Real implementation would need instrument-specific tick sizes
    return static_cast<int64_t>(price * 100.0); // Assuming cent precision
}

double CmeMdpSerializer::cmeFormatToPrice(int64_t cmeTicks) const {
    return static_cast<double>(cmeTicks) / 100.0;
}

} // namespace beacon::exchanges::serializers