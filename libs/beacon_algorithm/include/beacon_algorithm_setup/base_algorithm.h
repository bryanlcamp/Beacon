/*
 * =============================================================================
 * Project:   Beacon  
 * Library:   beacon_algorithms
 * Purpose:   Zero-overhead algorithm framework using concepts
 * Author:    Bryan Camp
 * =============================================================================
 */

#pragma once

// C++ standard library
#include <atomic>
#include <chrono>
#include <concepts>
#include <cstdint>
#include <string>
#include <string_view>
#include <type_traits>

// Third-party libraries
#include <nlohmann/json.hpp>

// Beacon libraries - import from proper libraries instead of duplicating
#include <beacon_decoders/decoded_message.h>
#include <beacon_hft/ringbuffer/spsc_ringbuffer.h>

// Local beacon_algorithms headers
#include "config_cache.h"

namespace beacon::algorithms {

// Use the canonical types from their proper libraries
using DecodedMarketMessage = beacon::decoders::DecodedMarketMessage;
using SpScRingBuffer = beacon::hft::ringbuffer::SpScRingBuffer;

// Concept for trading algorithms - pure algorithm framework
template<typename T>
concept TradingAlgorithm = requires(T algo, const DecodedMarketMessage& msg, const nlohmann::json& config) {
    { T(config) };                               
    { algo.OnMarketData(msg) } -> std::same_as<void>;
    { algo.GetName() } -> std::same_as<std::string_view>;
    { algo.IsActive() } -> std::same_as<bool>;
    { algo.Stop() } -> std::same_as<void>;
    requires std::is_trivially_destructible_v<T>;
    requires std::is_nothrow_move_constructible_v<T>;
};

// Cache-optimized constants
namespace detail {
    constexpr size_t CACHE_LINE_SIZE = 64;
    constexpr size_t L1_CACHE_SIZE = 32 * 1024;
    constexpr size_t L2_CACHE_SIZE = 256 * 1024;
    
    // Prefetch constants
    constexpr int PREFETCH_READ = 0;
    constexpr int PREFETCH_WRITE = 1;
    constexpr int PREFETCH_TEMPORAL_LOW = 0;
    constexpr int PREFETCH_TEMPORAL_MED = 1;
    constexpr int PREFETCH_TEMPORAL_HIGH = 2;
    constexpr int PREFETCH_TEMPORAL_MAX = 3;
}

// Base utility class for algorithms - ONLY algorithm-specific functionality
class alignas(detail::CACHE_LINE_SIZE) AlgorithmBase {
public:
    explicit AlgorithmBase(const nlohmann::json& config) noexcept : _config(config) {
        _configCache.Initialize(config);
        __builtin_prefetch(&_configCache, detail::PREFETCH_READ, detail::PREFETCH_TEMPORAL_MAX);
    }
    
    __attribute__((hot, flatten, always_inline)) void Stop() noexcept { 
        _active.store(false, std::memory_order_relaxed); 
    }
    
    __attribute__((hot, flatten, always_inline)) uint64_t GetMessagesProcessed() const noexcept { 
        return _messagesProcessed.load(std::memory_order_relaxed); 
    }
    
    __attribute__((hot, flatten, always_inline)) bool IsBaseActive() const noexcept {
        return _active.load(std::memory_order_relaxed);
    }

protected:
    alignas(detail::CACHE_LINE_SIZE) struct {
        std::atomic<bool> _active{true};
        std::atomic<uint64_t> _messagesProcessed{0};
        char _algorithmHotData[55];
    };
    
    __attribute__((hot, flatten, always_inline)) void IncrementMessageCount() noexcept {
        _messagesProcessed.fetch_add(1, std::memory_order_relaxed);
    }
    
    __attribute__((pure, always_inline)) double GetNumericParam(size_t index) const noexcept {
        return _configCache.GetNumericParam(index);
    }
    
    __attribute__((pure, always_inline)) bool GetBoolParam(size_t index) const noexcept {
        return _configCache.GetBoolParam(index);
    }
    
    __attribute__((pure, always_inline)) std::string_view GetStringParam(size_t index) const noexcept {
        return _configCache.GetStringParam(index);
    }
    
    alignas(detail::CACHE_LINE_SIZE) nlohmann::json _config;
    ConfigCache _configCache;
};

// Algorithm processor - interface only (implementation in beacon_hft)
template<TradingAlgorithm Algorithm>
class AlgorithmProcessor; // Forward declaration - implemented in beacon_hft

// Factory function - interface only (implementation in beacon_hft)
template<TradingAlgorithm Algorithm>
[[nodiscard]] auto CreateAlgorithmProcessor(SpScRingBuffer<DecodedMarketMessage, 8192>& queue, 
                                           const nlohmann::json& config) noexcept;

// Performance validation utility
template<TradingAlgorithm Algorithm>
constexpr bool ValidateAlgorithmPerformance() {
    static_assert(sizeof(Algorithm) <= detail::L1_CACHE_SIZE, 
                  "Algorithm too large - may not fit in L1 cache");
    static_assert(std::is_nothrow_move_constructible_v<Algorithm>, 
                  "Algorithm must be nothrow move constructible");
    static_assert(std::is_trivially_destructible_v<T>, 
                  "Algorithm should be trivially destructible for performance");
    return true;
}

} // namespace beacon::algorithms
