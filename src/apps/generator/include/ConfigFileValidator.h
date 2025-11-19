#pragma once

#include "ConfigFileParser.h"
#include <stdexcept>
#include <nlohmann/json.hpp>

namespace market_data_generator {
    class ConfigFileValidator {
    public:
        ConfigFileValidator(const ConfigFileParser& parser);
        ~ConfigFileValidator() = default;
        
        // Public validation method for external use
        bool isValid() const;
        
    private:
        void validate() const;
        
        // Specific validation methods
        void validateGlobalConfig() const;
        void validateSymbolConfigs() const;
        void validateSymbolPercentageSum() const;
        void validateSymbolConfig(const ConfigFileParser::SymbolConfig& symbolConfig) const;
        void validatePriceRange(const ConfigFileParser::PriceRange& priceRange, const std::string& symbol) const;
        void validateQuantityRange(const ConfigFileParser::QuantityRange& quantityRange, const std::string& symbol) const;
        void validatePreviousDay(const ConfigFileParser::PreviousDay& previousDay, const std::string& symbol) const;
        
        // Burst mode validation
        void validateBurstConfiguration() const;
        void validateBurstResourceAllocation() const;
        void validateBurstConflicts() const;
        
        // Wave mode validation
        void validateWaveConfiguration() const;
        void validateWaveAmplitudeAndBaseline() const;
        void validateWaveTimingConflicts() const;
        void validateWaveRealism() const;
        
        // Combined mode validation
        void validateCombinedModeConfiguration() const;
        void validateWaveBurstSynchronization() const;
        void validateCombinedIntensityLimits() const;
        void validateCombinedTimingHarmony() const;
        
        // Cross-field validation
        void validateQuantityMessageCombinations() const;
        
        // Field existence validation (requires access to raw JSON)
        static void validateRequiredGlobalFields(const nlohmann::json& globalJson);
        static void validateRequiredSymbolFields(const nlohmann::json& symbolJson, const std::string& symbol);
        
        ConfigFileParser _configFileParser;
    };
} // namespace market_data_generator