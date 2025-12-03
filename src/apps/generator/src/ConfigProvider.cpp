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
#include <beacon_exchange/protocol_common.h>  // Use your new exchange library
#include <nlohmann/json.hpp>

namespace beacon::generator {

ConfigProvider::ConfigProvider(const std::string& outputFilePath)
    : _outputFilePath(outputFilePath), _exchange(beacon::exchange::ExchangeType::NASDAQ) {
    // Updated to use new enum
}

ConfigProvider::ConfigProvider(const std::string& exchangeType, const std::string& outputFilePath)
    : _outputFilePath(outputFilePath) {
    std::string exchangeLower = exchangeType;
    std::transform(exchangeLower.begin(), exchangeLower.end(), exchangeLower.begin(), ::tolower);
    
    // Use new exchange library
    _exchange = beacon::exchange::StringToExchangeType(exchangeLower);
    
    if (_exchange == beacon::exchange::ExchangeType::INVALID) {
        throw std::invalid_argument("Invalid exchange type: '" + exchangeType + "'.");
    }
}

ConfigProvider::ConfigProvider(beacon::exchange::ExchangeType exchangeType, const std::string& outputFilePath)
    : _outputFilePath(outputFilePath), _exchange(exchangeType) {
    // Updated to use new enum type
    if (_exchange == beacon::exchange::ExchangeType::INVALID) {
        throw std::invalid_argument("Invalid exchange type: cannot be INVALID");
    }
}

bool ConfigProvider::LoadConfig(const std::string& configPath) {
    try {
        // Replace ConfigFileParser with direct JSON parsing (eliminate redundant class)
        std::ifstream file(configPath);
        if (!file.is_open()) {
            std::cerr << "Could not open configuration file: " << configPath << std::endl;
            return false;
        }
        
        nlohmann::json config;
        file >> config;
        
        // Parse settings directly (no ConfigFileParser needed)
        std::string exchangeStr = config.value("exchange", "nasdaq");
        std::transform(exchangeStr.begin(), exchangeStr.end(), exchangeStr.begin(), ::tolower);
        _exchange = beacon::exchange::StringToExchangeType(exchangeStr);
        
        _messageCount = config.value("message_count", 10000);
        _tradeProbability = config.value("trade_probability", 0.1);
        _flushInterval = config.value("flush_interval", 1000);
        
        // Parse symbols array
        if (config.contains("symbols") && config["symbols"].is_array()) {
            _symbols.clear();
            double percentPerSymbol = 100.0 / config["symbols"].size();
            
            for (const auto& symbolName : config["symbols"]) {
                if (symbolName.is_string()) {
                    SymbolData symbolData;
                    symbolData.symbolName = symbolName.get<std::string>();
                    symbolData.weight = percentPerSymbol;
                    symbolData.minPrice = 100.0;  // Default values
                    symbolData.maxPrice = 200.0;
                    symbolData.spreadPercent = _defaultSpreadPercent;
                    
                    _symbols.push_back(symbolData);
                }
            }
        }
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[ConfigProvider] Error loading config: " << e.what() << std::endl;
        return false;
    }
}

// DELETE OLD CONFLICTING METHODS - replaced by new unified approach
// std::unique_ptr<beacon::exchanges::serializers::ISerializeMarketData> ConfigProvider::CreateSerializer() const {
//     // This method conflicts with the new GetSerializer() that returns UnifiedMarketDataSerializer
// }

// std::unique_ptr<beacon::exchanges::serializers::ISerializeMarketData> ConfigProvider::GetSerializer() const {
//     return CreateSerializer();  // This also conflicts with new approach
// }

// ...existing getter methods unchanged...
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

beacon::exchange::ExchangeType ConfigProvider::GetExchangeType() const noexcept {
    return _exchange;
}

std::string ConfigProvider::GetExchangeTypeString() const noexcept {
    return beacon::exchange::ExchangeTypeToString(_exchange);
}

} // namespace beacon::generator::config