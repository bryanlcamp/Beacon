/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      NYSE Pillar market data encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/nyse/market_data_encoder.h>
#include <cstring>

namespace beacon::encoder::nyse {

// Simple placeholder structures - no external protocol dependencies
namespace {
    struct SimpleQuoteMessage {
        char msgType;
        uint64_t timestamp;
        uint64_t symbolSeqNum;
        char side;
        uint32_t price;
        uint32_t volume;
        char symbol[8];
    } __attribute__((packed));
    
    struct SimpleTradeMessage {
        char msgType;
        uint64_t timestamp;
        uint64_t symbolSeqNum;
        uint32_t price;
        uint32_t volume;
        uint64_t tradeId;
        char symbol[8];
    } __attribute__((packed));
}

size_t MarketDataEncoder::encode(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    if (message.isTrade()) {
        return encodeTradeMessage(message, buffer);
    } else {
        return encodeQuoteMessage(message, buffer);
    }
}

size_t MarketDataEncoder::encodeQuoteMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleQuoteMessage* quoteMsg = reinterpret_cast<SimpleQuoteMessage*>(buffer);
    
    quoteMsg->msgType = 'Q';
    quoteMsg->timestamp = message.timestamp;
    quoteMsg->symbolSeqNum = message.sequenceNum;
    quoteMsg->side = message.side;
    quoteMsg->price = message.price;
    quoteMsg->volume = message.quantity;
    
    // Copy symbol with proper padding
    std::memset(quoteMsg->symbol, ' ', sizeof(quoteMsg->symbol));
    std::memcpy(quoteMsg->symbol, message.symbol,
                std::min(static_cast<size_t>(message.symbolLength), sizeof(quoteMsg->symbol)));
    
    return sizeof(SimpleQuoteMessage);
}

size_t MarketDataEncoder::encodeTradeMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleTradeMessage* tradeMsg = reinterpret_cast<SimpleTradeMessage*>(buffer);
    
    tradeMsg->msgType = 'T';
    tradeMsg->timestamp = message.timestamp;
    tradeMsg->symbolSeqNum = message.sequenceNum;
    tradeMsg->price = message.price;
    tradeMsg->volume = message.quantity;
    tradeMsg->tradeId = message.sequenceNum;
    
    // Copy symbol with proper padding
    std::memset(tradeMsg->symbol, ' ', sizeof(tradeMsg->symbol));
    std::memcpy(tradeMsg->symbol, message.symbol,
                std::min(static_cast<size_t>(message.symbolLength), sizeof(tradeMsg->symbol)));
    
    return sizeof(SimpleTradeMessage);
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

} // namespace beacon::encoder::nyse
