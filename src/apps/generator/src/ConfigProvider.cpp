/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      Implements configuration loading from JSON files and factory
 *               methods for creating exchange-specific serializers. Validates
 *               all configuration parameters and provides defaults.
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <algorithm>
#include <fstream>
#include <iostream>
#include <stdexcept>

#include "../include/ConfigProvider.h"
#include "exchanges/protocol_common.h"
#include "../include/serializers/NsdqSerializer.h"
#include "../include/serializers/CmeSerializer.h"
#include "../include/serializers/NyseSerializer.h"
#include "../include/serializers/CsvSerializer.h"

namespace beacon::market_data_generator::config {

ConfigProvider::ConfigProvider(const std::string& outputFilePath)
    : _outputFilePath(outputFilePath), _exchange(beacon::exchanges::ExchangeType::NASDAQ) {
    // Default constructor - exchange will be set when config is loaded
}

ConfigProvider::ConfigProvider(const std::string& exchangeType, const std::string& outputFilePath)
    : _outputFilePath(outputFilePath) {
    // Convert exchange string to lowercase for consistency
    std::string exchangeLower = exchangeType;
    std::transform(exchangeLower.begin(), exchangeLower.end(), exchangeLower.begin(), ::tolower);
    
    // Convert to enum
    _exchange = beacon::exchanges::StringToExchangeType(exchangeLower);
    
    // Validate exchange type
    if (_exchange == beacon::exchanges::ExchangeType::INVALID) {
        const auto validTypes = beacon::exchanges::GetValidExchangeTypes();
        throw std::invalid_argument(
            "Invalid exchange type: '" + exchangeType + 
            "'. Valid exchanges are: '" + std::string{validTypes[0]} + "', '" + std::string{validTypes[1]} + "', '" + std::string{validTypes[2]} + "'."
        );
    }
}

ConfigProvider::ConfigProvider(beacon::exchanges::ExchangeType exchangeType, const std::string& outputFilePath)
    : _outputFilePath(outputFilePath), _exchange(exchangeType) {
    // Validate exchange type
    if (_exchange == beacon::exchanges::ExchangeType::INVALID) {
        throw std::invalid_argument("Invalid exchange type: cannot be INVALID");
    }
}

bool ConfigProvider::LoadConfig(const std::string& configPath) {
    try {
        // Load and parse configuration file
        _configParser = std::make_unique<::market_data_generator::ConfigFileParser>(configPath);
        
        // Extract global configuration
        const auto& globalConfig = _configParser->getGlobalConfig();
        _messageCount = globalConfig.NumMessages;
        
        // Convert exchange string to enum
        std::string exchangeLower = globalConfig.Exchange;
        std::transform(exchangeLower.begin(), exchangeLower.end(), exchangeLower.begin(), ::tolower);
        _exchange = beacon::exchanges::StringToExchangeType(exchangeLower);
        
        // Extract optional configuration values
        if (globalConfig.TradeProbability > 0.0) {
            _tradeProbability = globalConfig.TradeProbability;
        }
        if (globalConfig.FlushInterval > 0) {
            _flushInterval = globalConfig.FlushInterval;
        }
        
        // Validate exchange
        if (_exchange == beacon::exchanges::ExchangeType::INVALID) {
            const auto validTypes = beacon::exchanges::GetValidExchangeTypes();
            throw std::runtime_error(
                "Unsupported exchange: '" + globalConfig.Exchange +
                "'. Valid exchanges are: '" + std::string{validTypes[0]} + "', '" + std::string{validTypes[1]} + "', '" + std::string{validTypes[2]} + "'."
            );
        }
        
        // Convert symbols from ConfigFileParser to ConfigProvider format
        _symbols.clear();
        for (const auto& symbol : _configParser->getSymbols()) {
            SymbolData symbolData;
            symbolData.symbolName = symbol.SymbolName;
            symbolData.weight = symbol.PercentTotalMessages; // PercentTotalMessages from JSON
            symbolData.minPrice = symbol.priceRange.MinPrice;
            symbolData.maxPrice = symbol.priceRange.MaxPrice;
            symbolData.spreadPercent = symbol.SpreadPercentage;
            
            _symbols.push_back(symbolData);
        }

        return true;
        
    } 
    catch (const std::exception& e) {
        std::cerr << "[ConfigProvider] Error loading config: " << e.what() << std::endl;
        return false;
    }
}

std::unique_ptr<beacon::market_data_generator::serializers::IMarketDataSerializer> ConfigProvider::CreateSerializer() const {
    // If CSV mode is enabled, use CSV serializer regardless of exchange type
    if (_csvMode) {
        return std::make_unique<beacon::market_data_generator::serializers::CsvMarketDataSerializer>(_outputFilePath);
    }
    
    // Otherwise, use exchange-specific binary serializer
    using beacon::exchanges::ExchangeType;
    switch (_exchange) {
        case ExchangeType::NASDAQ:
            return std::make_unique<beacon::market_data_generator::serializers::NsdqMarketDataSerializer>(_outputFilePath, _flushInterval);
            
        case ExchangeType::CME:
            return std::make_unique<beacon::market_data_generator::serializers::CmeMarketDataSerializer>(_outputFilePath);
            
        case ExchangeType::NYSE:
            return std::make_unique<beacon::market_data_generator::serializers::NyseMarketDataSerializer>(_outputFilePath);
            
        case ExchangeType::INVALID:
        default:
            const auto validTypes = beacon::exchanges::GetValidExchangeTypes();
            throw std::runtime_error(
                "Unsupported exchange: '" + std::string{beacon::exchanges::ExchangeTypeToString(_exchange)} +
                "'. Valid exchanges are: '" + std::string{validTypes[0]} + "', '" + std::string{validTypes[1]} + "', '" + std::string{validTypes[2]} + "'. Ensure the exchange is correctly specified in the configuration file."
            );
    }
}

std::unique_ptr<beacon::market_data_generator::serializers::IMarketDataSerializer> ConfigProvider::GetSerializer() const {
    return CreateSerializer();
}

std::vector<SymbolData> ConfigProvider::GetSymbolsForGeneration() const {
    return _symbols;
}

size_t ConfigProvider::GetMessageCount() const {
    return _messageCount;
}

double ConfigProvider::GetTradeProbability() const {
    return _tradeProbability;
}

size_t ConfigProvider::GetFlushInterval() const {
    return _flushInterval;
}

void ConfigProvider::SetCsvMode(bool csvMode) {
    _csvMode = csvMode;
}

beacon::exchanges::ExchangeType ConfigProvider::GetExchangeType() const noexcept {
    return _exchange;
}

std::string ConfigProvider::GetExchangeTypeString() const noexcept {
    return std::string{beacon::exchanges::ExchangeTypeToString(_exchange)};
}



} // namespace beacon::market_data_generator::config