/*
 * =============================================================================
 * Project:   Beacon  
 * Library:   beacon_algorithm
 * Purpose:   High-performance configuration cache for trading algorithms
 * Author:    Bryan Camp
 * =============================================================================
 */

#pragma once

#include <nlohmann/json.hpp>
#include <string_view>
#include <cstring>
#include <cstdint>

namespace beacon::algorithm {

// Cache-optimized constants
namespace detail {
    constexpr size_t CACHE_LINE_SIZE = 64;
    constexpr size_t L1_CACHE_SIZE = 32 * 1024;    // 32KB typical L1
    constexpr size_t L2_CACHE_SIZE = 256 * 1024;   // 256KB typical L2
}

// High-performance configuration cache - exactly 2 cache lines for predictable access
struct alignas(detail::CACHE_LINE_SIZE) ConfigCache {
    // First cache line - most frequently accessed
    double numericParams[8];      // 64 bytes
    
    // Second cache line - less frequent access
    bool boolParams[8];           // 8 bytes  
    char stringParams[4][12];     // 48 bytes (4 * 12)
    uint32_t validMask;           // 4 bytes - bitmask for valid params
    char _padding[4];             // 4 bytes padding = 64 bytes total
    
    // Initialize from JSON configuration
    void Initialize(const nlohmann::json& config) noexcept;
    
    // Fast accessors with bounds checking
    __attribute__((pure, always_inline)) double GetNumericParam(size_t index) const noexcept {
        return (index < 8) ? numericParams[index] : 0.0;
    }
    
    __attribute__((pure, always_inline)) bool GetBoolParam(size_t index) const noexcept {
        return (index < 8) ? boolParams[index] : false;
    }
    
    __attribute__((pure, always_inline)) std::string_view GetStringParam(size_t index) const noexcept {
        return (index < 4) ? std::string_view(stringParams[index]) : std::string_view{};
    }
    
    // Check if parameter was present in original config
    __attribute__((pure, always_inline)) bool IsValid(size_t paramIndex) const noexcept {
        return (validMask & (1u << paramIndex)) != 0;
    }
};

// Standard parameter indices for common trading algorithm parameters
namespace ParamIndex {
    // Numeric parameters (0-7)
    constexpr size_t PRICE_THRESHOLD = 0;
    constexpr size_t VOLUME_THRESHOLD = 1;
    constexpr size_t TIME_WINDOW = 2;
    constexpr size_t MAX_POSITION = 3;
    constexpr size_t RISK_LIMIT = 4;
    constexpr size_t SLIPPAGE_TOLERANCE = 5;
    constexpr size_t MIN_ORDER_SIZE = 6;
    constexpr size_t MAX_ORDER_SIZE = 7;
    
    // Boolean parameters (8-15 in validMask)
    constexpr size_t ENABLED = 0;
    constexpr size_t DEBUG_MODE = 1;
    constexpr size_t RISK_CHECK = 2;
    constexpr size_t AUTO_HEDGE = 3;
    constexpr size_t USE_MARKET_ORDERS = 4;
    constexpr size_t ALLOW_SHORT = 5;
    constexpr size_t LOG_TRADES = 6;
    constexpr size_t VALIDATE_PRICES = 7;
    
    // String parameters (16-19 in validMask)
    constexpr size_t SYMBOL = 0;
    constexpr size_t EXCHANGE = 1;
    constexpr size_t ACCOUNT = 2;
    constexpr size_t STRATEGY_ID = 3;
}

} // namespace beacon::algorithm
