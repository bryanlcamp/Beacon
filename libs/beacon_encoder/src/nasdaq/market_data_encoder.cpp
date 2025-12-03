/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      NASDAQ ITCH market data encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/nasdaq/market_data_encoder.h>
#include <cstring>

namespace beacon::encoder::nasdaq {

// Simple placeholder structures until we have full protocol headers
namespace {
    struct SimpleAddOrder {
        char messageType;
        uint64_t timestamp;
        uint64_t orderReference;
        char side;
        uint32_t shares;
        uint32_t price;
        char stock[8];
    } __attribute__((packed));
    
    struct SimpleTrade {
        char messageType;
        uint64_t timestamp;
        uint64_t orderReference;
        char side;
        uint32_t shares;
        uint32_t price;
        uint64_t matchNumber;
        char stock[8];
    } __attribute__((packed));
}

size_t MarketDataEncoder::encode(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    if (message.isTrade()) {
        return encodeTradeMessage(message, buffer);
    } else {
        return encodeAddOrderMessage(message, buffer);
    }
}

size_t MarketDataEncoder::encodeAddOrderMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleAddOrder* addMsg = reinterpret_cast<SimpleAddOrder*>(buffer);
    
    addMsg->messageType = 'A';
    addMsg->timestamp = message.timestamp;
    addMsg->orderReference = message.sequenceNum;
    addMsg->side = message.side;
    addMsg->shares = message.quantity;
    addMsg->price = message.price;
    
    // Copy symbol with proper padding
    std::memset(addMsg->stock, ' ', sizeof(addMsg->stock));
    std::memcpy(addMsg->stock, message.symbol, 
                std::min(static_cast<size_t>(message.symbolLength), sizeof(addMsg->stock)));
    
    return sizeof(SimpleAddOrder);
}

size_t MarketDataEncoder::encodeTradeMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleTrade* tradeMsg = reinterpret_cast<SimpleTrade*>(buffer);
    
    tradeMsg->messageType = 'P';
    tradeMsg->timestamp = message.timestamp;
    tradeMsg->orderReference = message.sequenceNum;
    tradeMsg->side = message.side;
    tradeMsg->shares = message.quantity;
    tradeMsg->price = message.price;
    tradeMsg->matchNumber = message.sequenceNum;
    
    // Copy symbol with proper padding
    std::memset(tradeMsg->stock, ' ', sizeof(tradeMsg->stock));
    std::memcpy(tradeMsg->stock, message.symbol,
                std::min(static_cast<size_t>(message.symbolLength), sizeof(tradeMsg->stock)));
    
    return sizeof(SimpleTrade);
}

void MarketDataEncoder::writeToFile(const InternalMarketDataMessage& message) {
    uint8_t buffer[GetMaxMessageSize()];
    size_t bytesWritten = encode(message, buffer);
    
    if (bytesWritten > 0) {
        _outputFile.write(reinterpret_cast<const char*>(buffer), bytesWritten);
        _messageCount++;
        
        if (_messageCount % _flushInterval == 0) {
            flush();
        }
    }
}

void MarketDataEncoder::flush() {
    if (_outputFile.is_open()) {
        _outputFile.flush();
    }
}

} // namespace beacon::encoder::nasdaq
