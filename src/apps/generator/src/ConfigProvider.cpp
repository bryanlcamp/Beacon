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
#include "../include/serializers/NsdqSerializer.h"
#include "../include/serializers/CmeSerializer.h"
#include "../include/serializers/NyseSerializer.h"
#include "../include/serializers/CsvSerializer.h"

namespace beacon::market_data_generator::config {

ConfigProvider::ConfigProvider(const std::string& exchangeType, const std::string& outputFilePath)
    : _exchangeType(exchangeType), _outputFilePath(outputFilePath), _exchange(exchangeType) {
    // Ensure the exchange is converted to lowercase for consistency
    std::transform(_exchange.begin(), _exchange.end(), _exchange.begin(), ::tolower);
}

bool ConfigProvider::loadConfig(const std::string& configPath) {
    try {
        // Load and parse configuration file
        _configParser = std::make_unique<::market_data_generator::ConfigFileParser>(configPath);
        
        // Extract global configuration
        const auto& globalConfig = _configParser->getGlobalConfig();
        _messageCount = globalConfig.NumMessages;
        _exchange = globalConfig.Exchange;
        std::transform(_exchange.begin(), _exchange.end(), _exchange.begin(), ::tolower);
        
        // Extract optional configuration values
        if (globalConfig.TradeProbability > 0.0) {
            _tradeProbability = globalConfig.TradeProbability;
        }
        if (globalConfig.FlushInterval > 0) {
            _flushInterval = globalConfig.FlushInterval;
        }
        
        // Validate exchange
        if (_exchange != "nsdq" && _exchange != "cme" && _exchange != "nyse") {
            throw std::runtime_error(
                "Unsupported exchange: '" + _exchange +
                "'. Valid exchanges are: 'nsdq', 'cme', 'nyse'."
            );
        }
        
        // Extract wave and burst configuration
        _waveConfig = _configParser->getWaveConfig();
        _burstConfig = _configParser->getBurstConfig();
        
        // Convert symbols from ConfigFileParser to ConfigProvider format
        _symbols.clear();
        for (const auto& symbol : _configParser->getSymbols()) {
            SymbolData symbolData;
            symbolData.symbolName = symbol.SymbolName;
            symbolData.weight = symbol.PercentTotalMessages; // PercentTotalMessages from JSON
            symbolData.minPrice = symbol.PriceRange.MinPrice;
            symbolData.maxPrice = symbol.PriceRange.MaxPrice;
            symbolData.spreadPercent = symbol.SpreadPercentage;
            
            _symbols.push_back(symbolData);
        }

        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[ConfigProvider] Error loading config: " << e.what() << std::endl;
        return false;
    }
}

std::unique_ptr<serializers::IMarketDataSerializer> ConfigProvider::createSerializer() const {
    // If CSV mode is enabled, use CSV serializer regardless of exchange type
    if (_csvMode) {
        return std::make_unique<serializers::CsvMarketDataSerializer>(_outputFilePath);
    }
    
    // Otherwise, use exchange-specific binary serializer
    if (_exchange == "nsdq") {
        // Create serializer for NASDAQ with flush interval
        return std::make_unique<serializers::NsdqMarketDataSerializer>(_outputFilePath, _flushInterval);
    } else if (_exchange == "cme") {
        // Create serializer for CME
        return std::make_unique<serializers::CmeMarketDataSerializer>(_outputFilePath);
    } else if (_exchange == "nyse") {
        // Create serializer for NYSE
        return std::make_unique<serializers::NyseMarketDataSerializer>(_outputFilePath);
    } else {
        throw std::runtime_error(
            "Unsupported exchange: '" + _exchange +
            "'. Valid exchanges are: 'nsdq', 'cme', 'nyse'. Ensure the exchange is correctly specified in the configuration file."
        );
    }
}

std::unique_ptr<serializers::IMarketDataSerializer> ConfigProvider::getSerializer() const {
    return createSerializer();
}

std::vector<SymbolData> ConfigProvider::getSymbolsForGeneration() const {
    return _symbols;
}

size_t ConfigProvider::getMessageCount() const {
    return _messageCount;
}

double ConfigProvider::getTradeProbability() const {
    return _tradeProbability;
}

size_t ConfigProvider::getFlushInterval() const {
    return _flushInterval;
}

const ::market_data_generator::ConfigFileParser::WaveConfig& ConfigProvider::getWaveConfig() const {
    return _waveConfig;
}

const ::market_data_generator::ConfigFileParser::BurstConfig& ConfigProvider::getBurstConfig() const {
    return _burstConfig;
}

void ConfigProvider::setCsvMode(bool csvMode) {
    _csvMode = csvMode;
}

} // namespace beacon::market_data_generator::config