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

        /// @brief Wave configuration - always present market rhythm
        struct WaveConfig {
            int WaveDurationMs = 300000;          // Wave cycle duration (5 minutes default)
            double WaveAmplitudePercent = 100.0;  // Wave intensity (100% = flat, 150% = 1.5x variation)
            
            bool validate() const {
                return WaveDurationMs > 0 && WaveAmplitudePercent >= 50.0 && WaveAmplitudePercent <= 500.0;
            }
        }; // End WaveConfig

        /// @brief Burst configuration - optional market events
        struct BurstConfig {
            bool Enabled = false;                 // Enable/disable burst events
            double BurstIntensityPercent = 300.0; // Burst spike intensity (300% = 3x)
            int BurstFrequencyMs = 60000;         // Time between bursts (1 minute default)
            
            bool validate() const {
                // If disabled, validation always passes
                if (!Enabled) return true;
                // If enabled, validate the parameters
                return BurstIntensityPercent > 100.0 && BurstIntensityPercent <= 1000.0 &&
                       BurstFrequencyMs > 1000; // At least 1 second between bursts
            }
        }; // End BurstConfig

        /// @brief Global configuration for the generator
        class GlobalConfig {
        public:
            GlobalConfig() = default;
            
            int NumMessages = 0;
            std::string Exchange;
            double TradeProbability = 0.0;
            int FlushInterval = 0;
            double SpreadPercentage = 0.0;
            
            // Coordination settings
            bool BurstTogether = false;           // Coordinate burst timing across symbols
            bool WaveTogether = true;             // Coordinate wave timing across symbols
            
            // Always-present wave and optional burst configurations
            WaveConfig GlobalWaveConfig;
            BurstConfig GlobalBurstConfig;
            
            bool validate() const {
                // Only validate essential fields - optional fields have reasonable defaults
                return NumMessages > 0 && !Exchange.empty() &&
                       GlobalWaveConfig.validate() &&
                       GlobalBurstConfig.validate();
            }
        }; // End class GlobalConfig

        /// @brief Per symbol in the .json config file.
        /// @remark There can, and likely will be, multiple symbols.
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
            
            // Optional per-symbol wave/burst overrides
            bool HasSymbolWaveConfig = false;
            WaveConfig SymbolWaveConfig;
            bool HasSymbolBurstConfig = false;
            BurstConfig SymbolBurstConfig;
            
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
        const WaveConfig& getWaveConfig() const { return _globalConfig.GlobalWaveConfig; }
        const BurstConfig& getBurstConfig() const { return _globalConfig.GlobalBurstConfig; }

    private:
        /// @brief Private data members.
        std::vector<SymbolConfig> _symbols;
        GlobalConfig _globalConfig;

        /// @brief Private helper functions.
        void validate() const {
            if (!_globalConfig.validate()) {
                // Add debug info to identify the exact issue
                std::string debugInfo = "NumMessages: " + std::to_string(_globalConfig.NumMessages) + 
                                       ", Exchange: '" + _globalConfig.Exchange + "'" +
                                       ", WaveValid: " + std::to_string(_globalConfig.GlobalWaveConfig.validate()) +
                                       ", BurstValid: " + std::to_string(_globalConfig.GlobalBurstConfig.validate()) +
                                       ", WaveAmp: " + std::to_string(_globalConfig.GlobalWaveConfig.WaveAmplitudePercent) +
                                       ", BurstEnabled: " + std::to_string(_globalConfig.GlobalBurstConfig.Enabled) +
                                       ", BurstIntensity: " + std::to_string(_globalConfig.GlobalBurstConfig.BurstIntensityPercent);
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
        static PriceRange parsePriceRange(const nlohmann::json& j);
        static QuantityRange parseQuantityRange(const nlohmann::json& j);
        static PreviousDay parsePreviousDay(const nlohmann::json& j);
        static WaveConfig parseWaveConfig(const nlohmann::json& j);
        static BurstConfig parseBurstConfig(const nlohmann::json& j);
        static SymbolConfig parseSymbol(const nlohmann::json& j);
        static GlobalConfig parseGlobal(const nlohmann::json& j);
    }; // End class ConfigFileParser
} // namespace market_data_generator
