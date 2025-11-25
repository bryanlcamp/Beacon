/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      Provides configuration management for the market data generator,
 *               including parsing JSON config files and instantiating the
 *               appropriate exchange-specific serializer.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "ConfigFileParser.h"
#include "exchanges/protocol_common.h"
#include "serializers/MarketDataSerializer.h"
#include <memory>
#include <string>
#include <vector>

namespace beacon::market_data_generator::config {

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
    
    /// @brief Constructor with ExchangeType enum.
    /// @param exchangeType The exchange type as an enum value.
    /// @param outputFilePath The file path for serialized output.
    ConfigProvider(beacon::exchanges::ExchangeType exchangeType, const std::string& outputFilePath);

    /// @brief Get the current exchange type.
    /// @return The exchange type as an enum value.
    [[nodiscard]] beacon::exchanges::ExchangeType GetExchangeType() const noexcept;
    
    /// @brief Get the current exchange type as a string.
    /// @return The exchange type as a string (e.g., "nsdq", "cme", "nyse").
    [[nodiscard]] std::string GetExchangeTypeString() const noexcept;

    /// @brief Get the serializer based on the type.
    std::unique_ptr<beacon::market_data_generator::serializers::IMarketDataSerializer> GetSerializer() const;

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

    /// @brief Load symbols from a configuration file.
    /// @param configPath The path to the configuration file.
    void LoadSymbolsFromConfig(const std::string& configPath);

    /// @brief Load configuration from a file.
    /// @param configPath The path to the configuration file.
    bool LoadConfig(const std::string& configPath);

    /// @brief Create a serializer based on the exchange type.
    std::unique_ptr<beacon::market_data_generator::serializers::IMarketDataSerializer> CreateSerializer() const;

    /// @brief Enable CSV output mode instead of binary exchange format.
    /// @param csvMode True to enable CSV output, false for binary exchange format.
    void SetCsvMode(bool csvMode);



  private:
    std::string _outputFilePath; // The file path for serialized output.

    // Use the new ConfigFileParser
    std::unique_ptr<::market_data_generator::ConfigFileParser> _configParser;
    
    beacon::exchanges::ExchangeType _exchange = beacon::exchanges::ExchangeType::INVALID; // The exchange type.
    std::vector<SymbolData> _symbols; // Symbols for generation.
    size_t _messageCount = 10000; // Default message count.
    double _tradeProbability = 0.1; // Default 10% trades.
    size_t _flushInterval = 1000; // Default flush every 1000 messages.
    double _defaultSpreadPercent = 0.5; // Default 0.5% spread.
    bool _csvMode = false; // True for CSV output, false for binary
};

} // namespace beacon::market_data_generator::config