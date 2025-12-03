/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_exchange  
 * Purpose:      Common protocol definitions and exchange types
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <string>
#include <string_view>

namespace beacon::exchange {

/**
 * @brief Exchange type enumeration
 */
enum class ExchangeType {
    INVALID = 0,
    NASDAQ = 1,
    CME = 2,
    NYSE = 3
};

/**
 * @brief Convert exchange type to string
 */
constexpr std::string_view ExchangeTypeToString(ExchangeType type) noexcept {
    switch (type) {
        case ExchangeType::NASDAQ: return "nasdaq";
        case ExchangeType::CME: return "cme";
        case ExchangeType::NYSE: return "nyse";
        default: return "invalid";
    }
}

/**
 * @brief Convert string to exchange type
 */
constexpr ExchangeType StringToExchangeType(std::string_view str) noexcept {
    if (str == "nasdaq") return ExchangeType::NASDAQ;
    if (str == "cme") return ExchangeType::CME;
    if (str == "nyse") return ExchangeType::NYSE;
    return ExchangeType::INVALID;
}

} // namespace beacon::exchange
