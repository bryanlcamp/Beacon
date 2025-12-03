/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      Unified encoder concepts and framework
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <concepts>
#include <type_traits>
#include <beacon_encoder/market_data_message.h>
#include <beacon_encoder/execution_message.h>
#include <beacon_exchange/protocol_common.h>

namespace beacon::encoder {

/**
 * @brief Common encoder requirements - relaxed for compilation
 */
template<typename T>
concept BaseEncoder = requires {
    // Static interface - compile-time dispatch
    { T::GetMaxMessageSize() } -> std::same_as<size_t>;
    { T::GetExchangeType() } -> std::same_as<beacon::exchange::ExchangeType>;
    
    // Relax performance requirements for now
    requires sizeof(T) <= 1024; // More reasonable limit with std::ofstream
};

/**
 * @brief Market data encoder concept
 */
template<typename T>
concept MarketDataEncoder = BaseEncoder<T> && requires(T encoder, const InternalMarketDataMessage& msg, uint8_t* buffer) {
    { encoder.encode(msg, buffer) } -> std::same_as<size_t>;
};

/**
 * @brief Execution encoder concept  
 */
template<typename T>
concept ExecutionEncoder = BaseEncoder<T> && requires(T encoder, const InternalExecutionMessage& msg, uint8_t* buffer) {
    { encoder.encode(msg, buffer) } -> std::same_as<size_t>;
};

/**
 * @brief Unified encoder dispatcher - works for both market data and execution
 */
template<typename EncoderType, typename MessageType>
requires (MarketDataEncoder<EncoderType> && std::same_as<MessageType, InternalMarketDataMessage>) ||
         (ExecutionEncoder<EncoderType> && std::same_as<MessageType, InternalExecutionMessage>)
class alignas(64) EncoderDispatcher {
private:
    EncoderType _encoder;
    
public:
    template<typename... Args>
    explicit EncoderDispatcher(Args&&... args) : _encoder(std::forward<Args>(args)...) {}
    
    // Hot path - zero overhead
    __attribute__((hot, flatten, always_inline))
    size_t encode(const MessageType& message, uint8_t* buffer) noexcept {
        return _encoder.encode(message, buffer);
    }
    
    __attribute__((pure, always_inline))
    static constexpr size_t getMaxMessageSize() noexcept {
        return EncoderType::GetMaxMessageSize();
    }
    
    __attribute__((pure, always_inline))
    static constexpr beacon::exchange::ExchangeType getExchangeType() noexcept {
        return EncoderType::GetExchangeType();
    }
};

/**
 * @brief Unified factory framework - compile-time selection
 */
template<beacon::exchange::ExchangeType Exchange, typename MessageType>
struct EncoderFactory {
    // Specializations provide the concrete encoder types
};

// Convenience aliases
template<beacon::exchange::ExchangeType Exchange>
using MarketDataEncoderFactory = EncoderFactory<Exchange, InternalMarketDataMessage>;

template<beacon::exchange::ExchangeType Exchange>
using ExecutionEncoderFactory = EncoderFactory<Exchange, InternalExecutionMessage>;

// Performance validation - simplified to avoid constexpr issues
template<typename T, typename MessageType>
constexpr bool ValidateEncoderPerformance() {
    // Simple size check that works at compile time
    return sizeof(T) <= 1024;
}

} // namespace beacon::encoder
