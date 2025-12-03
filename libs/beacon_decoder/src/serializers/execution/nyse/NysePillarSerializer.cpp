/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      NYSE Pillar serializer implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/NysePillarSerializer.h>
#include <cstring>
#include <stdexcept>
#include <vector>

// SIMPLIFIED PROTOCOL STRUCTURES - no more complex protocol dependencies
namespace {
    struct PillarMessage {
        char messageType;
        uint64_t timestamp;
        char symbol[8];
        uint32_t price;
        uint32_t quantity;
        uint32_t sequenceNumber;
    } __attribute__((packed));
}

namespace beacon::exchanges::serializers {

NysePillarSerializer::NysePillarSerializer(const std::string& outputPath)
    : _outputPath(outputPath)
    , _outputFile(outputPath, std::ios::binary)
    , _messageCount(0) {
    
    if (!_outputFile) {
        throw std::runtime_error("Failed to open NYSE Pillar output file: " + _outputPath);
    }
}

NysePillarSerializer::~NysePillarSerializer() {
    if (_outputFile.is_open()) {
        Flush();
        _outputFile.close();
    }
}

void NysePillarSerializer::Serialize(const MarketDataMessage& Message) {
    if (Message.Type == "Trade") {
        SerializeTrade(Message);
    } else {
        SerializeAddOrder(Message);
    }
    
    _messageCount++;
    
    // Flush every 750 messages for NYSE
    if (_messageCount % 500 == 0) {
        Flush();
    }
}

void NysePillarSerializer::SerializeAddOrder(const MarketDataMessage& Message) {
    // TODO: Implement actual NYSE Pillar message structure
    // This is a placeholder implementation
    
    struct NyseAddOrderMessage {
        uint32_t sequenceNumber;
        char symbol[11]; // NYSE symbols up to 10 chars + null
        char side;
        uint32_t quantity;
        uint64_t price;
        uint64_t timestamp;
    } __attribute__((packed));
    
    NyseAddOrderMessage nyseMsg{};
    nyseMsg.sequenceNumber = static_cast<uint32_t>(Message.SequenceNumber);
    
    // Copy symbol (pad with null bytes)
    std::memset(nyseMsg.symbol, 0, sizeof(nyseMsg.symbol));
    std::memcpy(nyseMsg.symbol, Message.Symbol.c_str(),
                std::min(Message.Symbol.size(), sizeof(nyseMsg.symbol) - 1));
    
    nyseMsg.side = (Message.Type == "Buy") ? 'B' : 'S';
    nyseMsg.quantity = static_cast<uint32_t>(Message.Quantity);
    nyseMsg.price = priceToNyseFormat(Message.Price);
    nyseMsg.timestamp = Message.Timestamp;
    
    _outputFile.write(reinterpret_cast<const char*>(&nyseMsg), sizeof(nyseMsg));
}

void NysePillarSerializer::SerializeTrade(const MarketDataMessage& Message) {
    // TODO: Implement NYSE Trade message structure
    // For now, use same structure as AddOrder with different semantics
    SerializeAddOrder(Message);
}

std::unique_ptr<MarketDataMessage> NysePillarSerializer::Deserialize(const char* Data, size_t Size) {
    // TODO: Implement NYSE Pillar deserialization
    return nullptr;
}

void NysePillarSerializer::Flush() {
    if (_outputFile.is_open()) {
        _outputFile.flush();
    }
}

uint64_t NysePillarSerializer::priceToNyseFormat(double price) const {
    // NYSE typically uses cent precision
    return static_cast<uint64_t>(price * 100.0);
}

double NysePillarSerializer::nyseFormatToPrice(uint64_t nyseCents) const {
    return static_cast<double>(nyseCents) / 100.0;
}

} // namespace beacon::exchanges::serializers