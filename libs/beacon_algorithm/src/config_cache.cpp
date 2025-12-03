/*
 * =============================================================================
 * Project:   Beacon  
 * Library:   beacon_algorithm
 * Purpose:   Configuration cache implementation
 * Author:    Bryan Camp
 * =============================================================================
 */

// C++ standard library
#include <cstring>

// Third-party libraries
#include <nlohmann/json.hpp>

// Beacon libraries - fix the include path to match actual structure
#include "../include/beacon_algorithm_setup/config_cache.h"

namespace beacon::algorithm {

void ConfigCache::Initialize(const nlohmann::json& config) noexcept {
    // Clear valid mask
    this->validMask = 0;
    
    // Configuration constants
    constexpr size_t MAX_NUMERIC_PARAMS = 8;
    constexpr size_t MAX_BOOL_PARAMS = 8;
    constexpr size_t MAX_STRING_PARAMS = 4;
    constexpr size_t MAX_STRING_LENGTH = 11; // 12 chars total including null terminator
    
    // Pre-parse common numeric parameters with error handling
    constexpr const char* numericKeys[MAX_NUMERIC_PARAMS] = {"price_threshold", "volume_threshold", "time_window", 
                                                           "max_position", "risk_limit", "slippage_tolerance",
                                                           "min_order_size", "max_order_size"};
    
    for (size_t i = 0; i < MAX_NUMERIC_PARAMS; ++i) {
        if (config.contains(numericKeys[i])) {
            this->numericParams[i] = config[numericKeys[i]].get<double>();
            this->validMask |= (1u << i);
        }
    }
    
    // Pre-parse boolean parameters
    constexpr const char* boolKeys[MAX_BOOL_PARAMS] = {"enabled", "debug_mode", "risk_check", "auto_hedge",
                                                      "use_market_orders", "allow_short", "log_trades", "validate_prices"};
    
    for (size_t i = 0; i < MAX_BOOL_PARAMS; ++i) {
        if (config.contains(boolKeys[i])) {
            this->boolParams[i] = config[boolKeys[i]].get<bool>();
            this->validMask |= (1u << (i + MAX_NUMERIC_PARAMS));
        }
    }
    
    // Pre-parse string parameters
    constexpr const char* stringKeys[MAX_STRING_PARAMS] = {"symbol", "exchange", "account", "strategy_id"};
    
    for (size_t i = 0; i < MAX_STRING_PARAMS; ++i) {
        if (config.contains(stringKeys[i])) {
            std::string value = config[stringKeys[i]].get<std::string>();
            std::strncpy(this->stringParams[i], value.c_str(), MAX_STRING_LENGTH);
            this->stringParams[i][MAX_STRING_LENGTH] = '\0';
            this->validMask |= (1u << (i + MAX_NUMERIC_PARAMS + MAX_BOOL_PARAMS));
        }
    }
}

} // namespace beacon::algorithm
