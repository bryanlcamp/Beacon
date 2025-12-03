/*
 * =============================================================================
 * Project:      Beacon  
 * Library:      algorithms
 * Purpose:      Configuration parameter constants and keys
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <string_view>
#include <array>

namespace beacon::algorithms::config {

// Standard configuration parameter keys
namespace Keys {
    // Numeric parameters
    constexpr std::string_view PRICE_THRESHOLD = "price_threshold";
    constexpr std::string_view VOLUME_THRESHOLD = "volume_threshold"; 
    constexpr std::string_view TIME_WINDOW = "time_window";
    constexpr std::string_view MAX_POSITION = "max_position";
    constexpr std::string_view RISK_LIMIT = "risk_limit";
    constexpr std::string_view SLIPPAGE_TOLERANCE = "slippage_tolerance";
    constexpr std::string_view MIN_ORDER_SIZE = "min_order_size";
    constexpr std::string_view MAX_ORDER_SIZE = "max_order_size";
    
    // Boolean parameters
    constexpr std::string_view ENABLED = "enabled";
    constexpr std::string_view DEBUG_MODE = "debug_mode";
    constexpr std::string_view RISK_CHECK = "risk_check";
    constexpr std::string_view AUTO_HEDGE = "auto_hedge";
    constexpr std::string_view USE_MARKET_ORDERS = "use_market_orders";
    constexpr std::string_view ALLOW_SHORT = "allow_short";
    constexpr std::string_view LOG_TRADES = "log_trades";
    constexpr std::string_view VALIDATE_PRICES = "validate_prices";
    
    // String parameters
    constexpr std::string_view SYMBOL = "symbol";
    constexpr std::string_view EXCHANGE = "exchange";
    constexpr std::string_view ACCOUNT = "account";
    constexpr std::string_view STRATEGY_ID = "strategy_id";
}

// Organized parameter arrays for iteration
namespace Arrays {
    constexpr std::array<std::string_view, 8> NUMERIC_KEYS = {
        Keys::PRICE_THRESHOLD, Keys::VOLUME_THRESHOLD, Keys::TIME_WINDOW,
        Keys::MAX_POSITION, Keys::RISK_LIMIT, Keys::SLIPPAGE_TOLERANCE,
        Keys::MIN_ORDER_SIZE, Keys::MAX_ORDER_SIZE
    };
    
    constexpr std::array<std::string_view, 8> BOOL_KEYS = {
        Keys::ENABLED, Keys::DEBUG_MODE, Keys::RISK_CHECK, Keys::AUTO_HEDGE,
        Keys::USE_MARKET_ORDERS, Keys::ALLOW_SHORT, Keys::LOG_TRADES, Keys::VALIDATE_PRICES
    };
    
    constexpr std::array<std::string_view, 4> STRING_KEYS = {
        Keys::SYMBOL, Keys::EXCHANGE, Keys::ACCOUNT, Keys::STRATEGY_ID
    };
}

} // namespace beacon::algorithms::config
