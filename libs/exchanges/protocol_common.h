#pragma once

#include <array>
#include <cstdint>
#include <string_view>

namespace beacon::exchanges {

/**
 * @enum ExchangeType
 * @brief Supported exchange types throughout the Beacon trading system
 */
enum class ExchangeType {
    NASDAQ,  ///< NASDAQ - ITCH v5.0 protocol
    CME,     ///< Chicago Mercantile Exchange - MBO v3.0 protocol  
    NYSE,    ///< New York Stock Exchange - Pillar v3.2 protocol
    INVALID  ///< Invalid/uninitialized exchange type
};

/**
 * @brief Convert string to ExchangeType enum
 * @param exchangeStr String representation (case-insensitive)
 * @return ExchangeType enum value, INVALID if not recognized
 */
[[nodiscard]] constexpr ExchangeType StringToExchangeType(std::string_view exchangeStr) noexcept {
    if (exchangeStr == "nsdq" || exchangeStr == "nasdaq") {
        return ExchangeType::NASDAQ;
    }
    if (exchangeStr == "cme") {
        return ExchangeType::CME;
    }
    if (exchangeStr == "nyse") {
        return ExchangeType::NYSE;
    }
    return ExchangeType::INVALID;
}

/**
 * @brief Convert ExchangeType enum to string
 * @param type ExchangeType enum value
 * @return String representation of the exchange type
 */
[[nodiscard]] constexpr std::string_view ExchangeTypeToString(ExchangeType type) noexcept {
    switch (type) {
        case ExchangeType::NASDAQ: return "nsdq";
        case ExchangeType::CME:    return "cme";
        case ExchangeType::NYSE:   return "nyse";
        case ExchangeType::INVALID: return "invalid";
    }
    return "invalid";
}

/**
 * @brief Get human-readable name for ExchangeType
 * @param type ExchangeType enum value
 * @return Human-readable name of the exchange
 */
[[nodiscard]] constexpr std::string_view ExchangeTypeToDisplayName(ExchangeType type) noexcept {
    switch (type) {
        case ExchangeType::NASDAQ: return "NASDAQ";
        case ExchangeType::CME:    return "CME Group";
        case ExchangeType::NYSE:   return "NYSE";
        case ExchangeType::INVALID: return "Invalid";
    }
    return "Invalid";
}

/**
 * @brief Get all valid exchange type strings
 * @return Array of valid exchange type strings
 */
[[nodiscard]] constexpr std::array<std::string_view, 3> GetValidExchangeTypes() noexcept {
    return {"nsdq", "cme", "nyse"};
}

} // namespace beacon::exchanges

// Safest representation for exchange prices
struct ExchangeOrder {
  int64_t price; // price in smallest unit (e.g., cents, ticks, basis points)
  int32_t quantity;
  // ...existing code...
};