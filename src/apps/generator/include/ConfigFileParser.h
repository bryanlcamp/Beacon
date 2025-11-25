#pragma once

#include <cmath>
#include <stdexcept>
#include <string>
#include <vector>

#include <nlohmann/json.hpp>

namespace market_data_generator {
    class ConfigFileParser {
    public:
        /// @brief Per Symbol
        struct PriceRange {
            double MinPrice;
            double MaxPrice;
            double Weight;
            
            bool validate() const {
                return MinPrice >= 0.0 && MaxPrice >= MinPrice && Weight > 0.0;
            }
        }; // End PriceRange

        /// @brief Per Symbol
        struct QuantityRange {
            int MinQuantity;
            int MaxQuantity;
            double Weight;
            
            bool validate() const {
                return MinQuantity >= 0 && MaxQuantity >= MinQuantity && Weight > 0.0;
            }
        }; // End QuantityRange

        /// @brief Per Symbol
        struct PreviousDay {
            double OpenPrice;
            double HighPrice;
            double LowPrice;
            double ClosePrice;
            int Volume;
            
            bool validate() const {
                return OpenPrice >= 0.0 && HighPrice >= OpenPrice && LowPrice >= 0.0 && ClosePrice >= 0.0 && Volume >= 0;
            }
        }; // End PreviousDay



        /// @brief Simplified global configuration for the generator
        class GlobalConfig {
        public:
            GlobalConfig() = default;
            
            int NumMessages = 0;
            std::string Exchange;
            double TradeProbability = 0.0;
            int FlushInterval = 0;
            
            bool validate() const {
                return NumMessages > 0 && !Exchange.empty();
            }
        }; // End class GlobalConfig

        /// @brief Simplified symbol configuration
        class SymbolConfig {
        public:
            SymbolConfig(const std::string& symbolName,
                        double percentTotalMessages,
                        double spreadPercentage,
                        const PriceRange& priceRange,
                        const QuantityRange& quantityRange,
                        const PreviousDay& previousDay)
                : SymbolName(symbolName),
                  PercentTotalMessages(percentTotalMessages),
                  SpreadPercentage(spreadPercentage),
                  priceRange(priceRange),
                  quantityRange(quantityRange),
                  previousDay(previousDay) {
                validate();
            }

            std::string SymbolName;
            double PercentTotalMessages;
            double SpreadPercentage = 0.0;
            PriceRange priceRange;
            QuantityRange quantityRange;
            PreviousDay previousDay;
            
            bool validate() const {
                return !SymbolName.empty() &&
                       PercentTotalMessages >= 0.0 && PercentTotalMessages <= 100.0 &&
                       SpreadPercentage >= 0.0 &&
                       priceRange.validate() &&
                       quantityRange.validate() &&
                       previousDay.validate();
            }
        }; // End SymbolConfig

        /// @brief Main parser API
        ConfigFileParser(const std::string& configFile);
        
        const std::vector<SymbolConfig>& getSymbols() const { return _symbols; }
        const GlobalConfig& getGlobalConfig() const { return _globalConfig; }

    private:
        /// @brief Private data members.
        std::vector<SymbolConfig> _symbols;
        GlobalConfig _globalConfig;

        /// @brief Private helper functions.
        void parseSimpleFormat(const nlohmann::json& j);
        bool isSimpleFormat(const nlohmann::json& j) const;
        void validate() const {
            if (!_globalConfig.validate()) {
                // Add debug info to identify the exact issue
                std::string debugInfo = "NumMessages: " + std::to_string(_globalConfig.NumMessages) + 
                                       ", Exchange: '" + _globalConfig.Exchange + "'" +
                                       ", TradeProbability: " + std::to_string(_globalConfig.TradeProbability) +
                                       ", FlushInterval: " + std::to_string(_globalConfig.FlushInterval);
                throw std::runtime_error("Configuration validation failed: Global configuration is invalid. Debug: " + debugInfo);
            }
            if (_symbols.empty()) {
                throw std::runtime_error("Configuration validation failed: No symbols defined. At least one symbol is required.");
            }
            
            double totalPercent = 0.0;
            for (const auto& s : _symbols) {
                if (!s.validate()) {
                    throw std::runtime_error("Configuration validation failed: Symbol '" + s.SymbolName + 
                                            "' has invalid configuration. Check price ranges, percentages (0-100), and spread values.");
                }
                totalPercent += s.PercentTotalMessages;
            }
            
            if (std::abs(totalPercent - 100.0) > 0.01) {
                throw std::runtime_error("Configuration validation failed: Symbol percentages must sum to 100%, got " + 
                                        std::to_string(totalPercent) + "%");
            }
        }

        void parse(const std::string& filename);
    }; // End class ConfigFileParser
} // namespace market_data_generator
