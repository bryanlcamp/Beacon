/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_exchange
 * Purpose:      Common exchange protocol definitions and enums
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <string>

namespace beacon::exchange {

/**
 * @brief Supported exchange types
 */
enum class ExchangeType : uint8_t {
    INVALID = 0,
    NASDAQ  = 1,  // NASDAQ ITCH/OUCH
    CME     = 2,  // CME MDP
    NYSE    = 3,  // NYSE Pillar
    CBOE    = 4,  // CBOE Pitch
    IEX     = 5   // IEX DEEP
};

/**
 * @brief Convert exchange type to string
 */
inline std::string ExchangeTypeToString(ExchangeType type) {
    switch (type) {
        case ExchangeType::NASDAQ: return "nasdaq";
        case ExchangeType::CME:    return "cme";
        case ExchangeType::NYSE:   return "nyse";
        case ExchangeType::CBOE:   return "cboe";
        case ExchangeType::IEX:    return "iex";
        default:                   return "invalid";
    }
}

/**
 * @brief Convert string to exchange type
 */
inline ExchangeType StringToExchangeType(const std::string& str) {
    if (str == "nasdaq") return ExchangeType::NASDAQ;
    if (str == "cme")    return ExchangeType::CME;
    if (str == "nyse")   return ExchangeType::NYSE;
    if (str == "cboe")   return ExchangeType::CBOE;
    if (str == "iex")    return ExchangeType::IEX;
    return ExchangeType::INVALID;
}

} // namespace beacon::exchange
