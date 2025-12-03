/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      CME MDP market data encoder
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <fstream>
#include <string>
#include <beacon_encoder/market_data_message.h>
#include <beacon_encoder/encoder_concepts.h>
#include <beacon_exchange/protocol_common.h>

namespace beacon::encoder::cme {

// CME Market Data Encoder (MDP) - zero overhead
class alignas(64) MarketDataEncoder {
private:
    std::ofstream _outputFile;
    uint64_t _messageCount{0};
    uint32_t _flushInterval;
    
    // Add missing private method declarations to match implementation
    __attribute__((hot, flatten, always_inline))
    size_t encodeBookUpdateMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept;
    
    __attribute__((hot, flatten, always_inline))
    size_t encodeTradeMessage(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept;
    
public:
    explicit MarketDataEncoder(const std::string& outputPath, uint32_t flushInterval = 1000)
        : _outputFile(outputPath, std::ios::binary), _flushInterval(flushInterval) {}
    
    static constexpr size_t GetMaxMessageSize() noexcept { return 128; } // CME messages can be larger
    static constexpr beacon::exchange::ExchangeType GetExchangeType() noexcept { 
        return beacon::exchange::ExchangeType::CME; 
    }
    
    __attribute__((hot, flatten, always_inline))
    size_t encode(const InternalMarketDataMessage& message, uint8_t* buffer) noexcept;
    
    void writeToFile(const InternalMarketDataMessage& message);
    void flush();
};

// Validation
static_assert(beacon::encoder::ValidateEncoderPerformance<MarketDataEncoder, InternalMarketDataMessage>());

} // namespace beacon::encoder::cme

// Factory specialization
namespace beacon::encoder {

template<>
struct EncoderFactory<beacon::exchange::ExchangeType::CME, InternalMarketDataMessage> {
    using type = EncoderDispatcher<cme::MarketDataEncoder, InternalMarketDataMessage>;
    
    template<typename... Args>
    static type create(Args&&... args) {
        return type(std::forward<Args>(args)...);
    }
};

} // namespace beacon::encoder
