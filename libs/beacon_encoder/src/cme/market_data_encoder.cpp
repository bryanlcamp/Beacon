/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      CME MDP market data encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/cme/market_data_encoder.h>
#include <cstring>

namespace beacon::encoder::cme {

// Simple placeholder structures - no external protocol dependencies
namespace {
    struct SimpleBookUpdate {
        uint32_t securityId;
        uint64_t transactTime;
        uint8_t matchEventIndicator;
        uint32_t price;
        uint32_t size;
        uint8_t updateAction;
        uint8_t priceLevel;
    } __attribute__((packed));
    
    struct SimpleTradeSummary {
        uint32_t securityId;
        uint64_t transactTime;
        uint32_t lastPx;
        uint32_t lastQty;
        uint64_t tradeId;
        uint8_t aggressorSide;
    } __attribute__((packed));
}

size_t MarketDataEncoder::encode(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    if (message.isTrade()) {
        return encodeTradeMessage(message, buffer);
    } else {
        return encodeBookUpdateMessage(message, buffer);
    }
}

size_t MarketDataEncoder::encodeBookUpdateMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleBookUpdate* bookMsg = reinterpret_cast<SimpleBookUpdate*>(buffer);
    
    bookMsg->securityId = 12345;  // Default security ID
    bookMsg->transactTime = message.timestamp;
    bookMsg->matchEventIndicator = 0x01;
    bookMsg->price = message.price;
    bookMsg->size = message.quantity;
    bookMsg->updateAction = (message.side == 'B') ? 0 : 1; // 0=New, 1=Change
    bookMsg->priceLevel = 1; // Top of book
    
    return sizeof(SimpleBookUpdate);
}

size_t MarketDataEncoder::encodeTradeMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept {
    SimpleTradeSummary* tradeMsg = reinterpret_cast<SimpleTradeSummary*>(buffer);
    
    tradeMsg->securityId = 12345;  // Default security ID
    tradeMsg->transactTime = message.timestamp;
    tradeMsg->lastPx = message.price;
    tradeMsg->lastQty = message.quantity;
    tradeMsg->tradeId = message.sequenceNum;
    tradeMsg->aggressorSide = (message.side == 'B') ? 1 : 2; // 1=Buy, 2=Sell
    
    return sizeof(SimpleTradeSummary);
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

} // namespace beacon::encoder::cme
