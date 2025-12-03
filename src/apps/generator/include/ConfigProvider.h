/*
 * =============================================================================
 * Project:      Beacon
 * Application:  generator
 * Purpose:      Provides configuration management for the market data generator,
 *               including parsing JSON config files and instantiating the
 *               appropriate exchange-specific serializer.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <beacon_exchange/protocol_common.h>
#include "UnifiedSerializer.h"
#include <memory>
#include <string>
#include <vector>
#include <fstream>
#include <iostream>

// Use nlohmann/json from your vendor directory - correct path
#include <nlohmann/json.hpp>

namespace beacon::generator::config {

/// @brief Represents data for a symbol, including its distribution weight and price range.
struct SymbolData {
    std::string symbolName; // The name of the symbol (e.g., "AAPL").
    double weight;          // The distribution percentage (1-100, e.g., 60 for 60%).
    double minPrice;        // The minimum price for the symbol.
    double maxPrice;        // The maximum price for the symbol.
    double spreadPercent;   // The bid-ask spread as percentage (e.g., 0.5 for 0.5%).
};

class ConfigProvider {
  public:
    /// @brief Constructor for loading configuration from file (exchange type determined from config).
    /// @param outputFilePath The file path for serialized output.
    explicit ConfigProvider(const std::string& outputFilePath);

    /// @brief Constructor.
    /// @param exchangeType The type of exchange to use (e.g., "nsdq", "cme", "nyse") - will be converted to enum.
    /// @param outputFilePath The file path for serialized output.
    ConfigProvider(const std::string& exchangeType, const std::string& outputFilePath);
    
    /// @brief Constructor with ExchangeType enum using NEW enum.
    ConfigProvider(beacon::exchange::ExchangeType exchangeType, const std::string& outputFilePath);

    /**
     * @brief Get serializer using NEW unified approach
     */
    std::unique_ptr<beacon::generator::UnifiedMarketDataSerializer> GetSerializer() const {
        std::string exchangeStr = beacon::exchange::ExchangeTypeToString(_exchange);
        return std::make_unique<beacon::generator::UnifiedMarketDataSerializer>(exchangeStr, _outputFilePath);
    }

    /**
     * @brief Get exchange type using new exchange library
     */
    [[nodiscard]] beacon::exchange::ExchangeType GetExchangeType() const noexcept {
        return _exchange;
    }
    
    /**
     * @brief Get exchange type string using new exchange library
     */
    [[nodiscard]] std::string GetExchangeTypeString() const noexcept {
        return beacon::exchange::ExchangeTypeToString(_exchange);
    }

    /// @brief Get the symbols for generation.
    /// @return A vector of SymbolData objects.
    std::vector<SymbolData> GetSymbolsForGeneration() const;

    /// @brief Get the total message count.
    /// @return The number of messages to generate.
    size_t GetMessageCount() const;

    /// @brief Get the trade probability.
    /// @return The probability (0.0-1.0) that a message is a trade.
    double GetTradeProbability() const;

    /// @brief Get the flush interval.
    /// @return The number of messages between buffer flushes.
    size_t GetFlushInterval() const;

    /// @brief Load configuration from JSON file (integrated parsing - no ConfigFileParser needed)
    bool LoadConfig(const std::string& configPath) {
        std::ifstream file(configPath);
        if (!file.is_open()) {
            return false;
        }
        
        nlohmann::json config;
        try {
            file >> config;
            
            // Parse exchange type
            if (config.contains("exchange")) {
                std::string exchangeStr = config["exchange"];
                _exchange = beacon::exchange::StringToExchangeType(exchangeStr);
            }
            
            // Parse symbols
            if (config.contains("symbols") && config["symbols"].is_array()) {
                _symbols.clear();
                for (const auto& symbolConfig : config["symbols"]) {
                    SymbolData symbol;
                    symbol.symbolName = symbolConfig.value("symbol", "");
                    symbol.weight = symbolConfig.value("weight", 10.0);
                    symbol.minPrice = symbolConfig.value("min_price", 100.0);
                    symbol.maxPrice = symbolConfig.value("max_price", 200.0);
                    symbol.spreadPercent = symbolConfig.value("spread_percent", _defaultSpreadPercent);
                    _symbols.push_back(symbol);
                }
            }
            
            // Parse other settings
            _messageCount = config.value("message_count", _messageCount);
            _tradeProbability = config.value("trade_probability", _tradeProbability);
            _flushInterval = config.value("flush_interval", _flushInterval);
            
            return true;
            
        } catch (const std::exception& e) {
            std::cerr << "Error parsing config: " << e.what() << std::endl;
            return false;
        }
    }

    /// @brief Enable CSV output mode instead of binary exchange format.
    /// @param csvMode True to enable CSV output, false for binary exchange format.
    void SetCsvMode(bool csvMode);

  private:
    std::string _outputFilePath; // The file path for serialized output.
    
    // Remove ConfigFileParser dependency - no longer needed
    // std::unique_ptr<::market_data_generator::ConfigFileParser> _configParser;
    
    beacon::exchange::ExchangeType _exchange = beacon::exchange::ExchangeType::INVALID;  // Use new enum
    std::vector<SymbolData> _symbols; // Symbols for generation.
    size_t _messageCount = 10000; // Default message count.
    double _tradeProbability = 0.1; // Default 10% trades.
    size_t _flushInterval = 1000; // Default flush every 1000 messages.
    double _defaultSpreadPercent = 0.5; // Default 0.5% spread.
    bool _csvMode = false; // True for CSV output, false for binary
};

} // namespace beacon::generator::config