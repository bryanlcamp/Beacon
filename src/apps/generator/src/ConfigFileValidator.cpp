#include "../include/ConfigFileValidator.h"
#include <cmath>
#include <sstream>

namespace market_data_generator {
    ConfigFileValidator::ConfigFileValidator(const ConfigFileParser& parser)
        : _configFileParser(parser) {
        validate();
    }

    bool ConfigFileValidator::isValid() const {
        try {
            validate();
            return true;
        } catch (const std::exception&) {
            return false;
        }
    }

    void ConfigFileValidator::validate() const {
        validateGlobalConfig();
        validateSymbolConfigs();
        validateSymbolPercentageSum();
        validateQuantityMessageCombinations();
        
        // Mode-specific validation
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        // Note: When we add mode field to GlobalConfig, we'll check it here
        // For now, always validate both burst and wave configs if they exist
        validateBurstConfiguration();
        validateWaveConfiguration();
        validateCombinedModeConfiguration();
    }

    void ConfigFileValidator::validateGlobalConfig() const {
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        if (globalConfig.num_messages <= 0) {
            throw std::runtime_error("Global config: num_messages must be greater than 0, got: " + 
                                   std::to_string(globalConfig.num_messages));
        }
        
        if (globalConfig.exchange.empty()) {
            throw std::runtime_error("Global config: exchange cannot be empty");
        }
        
        if (globalConfig.trade_probability < 0.0 || globalConfig.trade_probability > 1.0) {
            throw std::runtime_error("Global config: trade_probability must be between 0.0 and 1.0, got: " + 
                                   std::to_string(globalConfig.trade_probability));
        }
        
        if (globalConfig.flush_interval <= 0) {
            throw std::runtime_error("Global config: flush_interval must be positive, got: " + 
                                   std::to_string(globalConfig.flush_interval));
        }
        
        if (globalConfig.spread_percentage < 0.0) {
            throw std::runtime_error("Global config: spread_percentage must be non-negative, got: " + 
                                   std::to_string(globalConfig.spread_percentage));
        }
    }

    void ConfigFileValidator::validateSymbolConfigs() const {
        const auto& symbols = _configFileParser.getSymbols();
        
        if (symbols.empty()) {
            throw std::runtime_error("Symbol configs: At least one symbol must be configured");
        }
        
        for (const auto& symbolConfig : symbols) {
            validateSymbolConfig(symbolConfig);
        }
    }

    void ConfigFileValidator::validateSymbolPercentageSum() const {
        const auto& symbols = _configFileParser.getSymbols();
        
        double totalPercent = 0.0;
        std::ostringstream symbolList;
        
        for (size_t i = 0; i < symbols.size(); ++i) {
            totalPercent += symbols[i]._percentTotalMessages;
            symbolList << symbols[i]._symbol << "(" << symbols[i]._percentTotalMessages << "%)";
            if (i < symbols.size() - 1) {
                symbolList << ", ";
            }
        }
        
        // Use epsilon comparison for floating point
        const double epsilon = 1e-6;
        if (std::abs(totalPercent - 100.0) > epsilon) {
            throw std::runtime_error("Symbol percentage validation failed: All symbol percent_num_messages must sum to 100.0%. " +
                                   std::string("Current sum: ") + std::to_string(totalPercent) + "%. " +
                                   std::string("Symbols: ") + symbolList.str());
        }
    }

    void ConfigFileValidator::validateSymbolConfig(const ConfigFileParser::SymbolConfig& symbolConfig) const {
        if (symbolConfig._symbol.empty()) {
            throw std::runtime_error("Symbol config: symbol name cannot be empty");
        }
        
        if (symbolConfig._percentTotalMessages <= 0.0 || symbolConfig._percentTotalMessages > 100.0) {
            throw std::runtime_error("Symbol '" + symbolConfig._symbol + "': percent_num_messages must be between 0.0 (exclusive) and 100.0, got: " + 
                                   std::to_string(symbolConfig._percentTotalMessages));
        }
        
        if (symbolConfig._spreadPercentage < 0.0) {
            throw std::runtime_error("Symbol '" + symbolConfig._symbol + "': spread_percentage must be non-negative, got: " + 
                                   std::to_string(symbolConfig._spreadPercentage));
        }
        
        validatePriceRange(symbolConfig._priceRange, symbolConfig._symbol);
        validateQuantityRange(symbolConfig._quantityRange, symbolConfig._symbol);
        validatePreviousDay(symbolConfig._previousDay, symbolConfig._symbol);
    }

    void ConfigFileValidator::validatePriceRange(const ConfigFileParser::PriceRange& priceRange, const std::string& symbol) const {
        if (priceRange.min_price <= 0.0) {
            throw std::runtime_error("Symbol '" + symbol + "': price_range min_price must be positive, got: " + 
                                   std::to_string(priceRange.min_price));
        }
        
        if (priceRange.max_price <= priceRange.min_price) {
            throw std::runtime_error("Symbol '" + symbol + "': price_range max_price (" + std::to_string(priceRange.max_price) + 
                                   ") must be > min_price (" + std::to_string(priceRange.min_price) + ")");
        }
        
        if (priceRange.weight <= 0.0) {
            throw std::runtime_error("Symbol '" + symbol + "': price_range weight must be positive, got: " + 
                                   std::to_string(priceRange.weight));
        }
    }

    void ConfigFileValidator::validateQuantityRange(const ConfigFileParser::QuantityRange& quantityRange, const std::string& symbol) const {
        if (quantityRange.min_quantity <= 0) {
            throw std::runtime_error("Symbol '" + symbol + "': quantity_range min_quantity must be positive, got: " + 
                                   std::to_string(quantityRange.min_quantity));
        }
        
        if (quantityRange.max_quantity <= quantityRange.min_quantity) {
            throw std::runtime_error("Symbol '" + symbol + "': quantity_range max_quantity (" + std::to_string(quantityRange.max_quantity) + 
                                   ") must be > min_quantity (" + std::to_string(quantityRange.min_quantity) + ")");
        }
        
        if (quantityRange.weight <= 0.0) {
            throw std::runtime_error("Symbol '" + symbol + "': quantity_range weight must be positive, got: " + 
                                   std::to_string(quantityRange.weight));
        }
    }

    void ConfigFileValidator::validatePreviousDay(const ConfigFileParser::PreviousDay& previousDay, const std::string& symbol) const {
        if (previousDay.open_price <= 0.0 || previousDay.high_price <= 0.0 || 
            previousDay.low_price <= 0.0 || previousDay.close_price <= 0.0) {
            throw std::runtime_error("Symbol '" + symbol + "': all previous day prices must be positive");
        }
        
        if (previousDay.high_price < previousDay.low_price) {
            throw std::runtime_error("Symbol '" + symbol + "': previous day high_price (" + std::to_string(previousDay.high_price) + 
                                   ") must be >= low_price (" + std::to_string(previousDay.low_price) + ")");
        }
        
        if (previousDay.volume <= 0) {
            throw std::runtime_error("Symbol '" + symbol + "': previous day volume must be positive, got: " + 
                                   std::to_string(previousDay.volume));
        }
    }

    void ConfigFileValidator::validateRequiredGlobalFields(const nlohmann::json& globalJson) {
        // Required global fields
        std::vector<std::string> requiredFields = {
            "num_messages", 
            "exchange"
        };
        
        for (const auto& field : requiredFields) {
            if (!globalJson.contains(field)) {
                throw std::runtime_error("Global config: Required field '" + field + "' is missing");
            }
        }
        
        // Check for null values in required fields
        if (globalJson["num_messages"].is_null()) {
            throw std::runtime_error("Global config: Field 'num_messages' cannot be null");
        }
        
        if (globalJson["exchange"].is_null()) {
            throw std::runtime_error("Global config: Field 'exchange' cannot be null");
        }
    }

    void ConfigFileValidator::validateRequiredSymbolFields(const nlohmann::json& symbolJson, const std::string& symbol) {
        // Required symbol fields
        std::vector<std::string> requiredFields = {
            "symbol", 
            "percent_num_messages",
            "price_range",
            "quantity_range",
            "prev_day"
        };
        
        for (const auto& field : requiredFields) {
            if (!symbolJson.contains(field)) {
                throw std::runtime_error("Symbol config '" + symbol + "': Required field '" + field + "' is missing");
            }
        }
        
        // Check nested required fields in price_range
        if (symbolJson.contains("price_range")) {
            const auto& priceRange = symbolJson["price_range"];
            std::vector<std::string> priceFields = {"min_price", "max_price", "weight"};
            for (const auto& field : priceFields) {
                if (!priceRange.contains(field)) {
                    throw std::runtime_error("Symbol '" + symbol + "' price_range: Required field '" + field + "' is missing");
                }
            }
        }
        
        // Check nested required fields in quantity_range
        if (symbolJson.contains("quantity_range")) {
            const auto& quantityRange = symbolJson["quantity_range"];
            std::vector<std::string> quantityFields = {"min_quantity", "max_quantity", "weight"};
            for (const auto& field : quantityFields) {
                if (!quantityRange.contains(field)) {
                    throw std::runtime_error("Symbol '" + symbol + "' quantity_range: Required field '" + field + "' is missing");
                }
            }
        }
        
        // Check nested required fields in prev_day
        if (symbolJson.contains("prev_day")) {
            const auto& prevDay = symbolJson["prev_day"];
            std::vector<std::string> prevDayFields = {"open_price", "high_price", "low_price", "close_price", "volume"};
            for (const auto& field : prevDayFields) {
                if (!prevDay.contains(field)) {
                    throw std::runtime_error("Symbol '" + symbol + "' prev_day: Required field '" + field + "' is missing");
                }
            }
        }
    }

    void ConfigFileValidator::validateBurstConfiguration() const {
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        // Only validate burst settings if mode is "burst"
        // Note: This assumes we'll add a mode field to GlobalConfig
        // For now, we'll validate burst settings if burst_together exists
        
        validateBurstResourceAllocation();
        validateBurstConflicts();
    }

    void ConfigFileValidator::validateBurstResourceAllocation() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        // Check if total burst allocation could exceed system capacity
        double totalBurstIntensity = 0.0;
        size_t totalExpectedBurstMessages = 0;
        
        for (const auto& symbolConfig : symbols) {
            // Calculate potential burst load per symbol
            double symbolMessages = globalConfig._numMessages * (symbolConfig._percentTotalMessages / 100.0);
            
            // Assume maximum burst intensity (this would come from burst config when implemented)
            // For now, use trade_probability as a proxy for burst intensity
            double burstIntensity = symbolConfig._spreadPercentage; // Using spread as proxy for now
            totalBurstIntensity += burstIntensity;
            
            // Estimate burst message volume (assuming 10x normal rate during burst)
            totalExpectedBurstMessages += static_cast<size_t>(symbolMessages * 10.0);
        }
        
        // Validate reasonable burst intensity limits
        if (totalBurstIntensity > 500.0) { // 500% total burst capacity seems reasonable
            throw std::runtime_error("Burst validation: Total burst intensity (" + 
                                   std::to_string(totalBurstIntensity) + 
                                   "%) exceeds recommended maximum of 500%. "
                                   "Consider reducing individual symbol burst intensities.");
        }
        
        // Validate message volume during burst periods
        if (totalExpectedBurstMessages > globalConfig._numMessages * 50) {
            throw std::runtime_error("Burst validation: Expected burst message volume (" + 
                                   std::to_string(totalExpectedBurstMessages) + 
                                   ") could exceed 50x normal volume. "
                                   "This may cause memory or performance issues.");
        }
    }

    void ConfigFileValidator::validateBurstConflicts() const {
        const auto& symbols = _configFileParser.getSymbols();
        
        // Calculate potential concurrent burst load when burst_together=false
        // Only worry about conflicts if multiple symbols could create significant load together
        
        double totalPotentialBurstLoad = 0.0;
        std::vector<std::pair<std::string, double>> burstCapableSymbols;
        
        for (const auto& symbolConfig : symbols) {
            // Any symbol can burst, but only care about system impact
            // A 1% symbol bursting is fine, a 60% symbol needs consideration
            if (symbolConfig._percentTotalMessages >= 5.0) {  // Only symbols with ≥5% matter for system load
                burstCapableSymbols.emplace_back(symbolConfig._symbol, symbolConfig._percentTotalMessages);
                totalPotentialBurstLoad += symbolConfig._percentTotalMessages;
            }
        }
        
        // Only warn if we have multiple significant symbols that could burst simultaneously
        // AND their combined load could be problematic
        if (burstCapableSymbols.size() >= 2 && totalPotentialBurstLoad > 70.0) {
            std::ostringstream conflictWarning;
            conflictWarning << "Burst validation warning: When burst_together=false, multiple significant symbols "
                           << "could burst simultaneously: ";
            
            for (size_t i = 0; i < burstCapableSymbols.size(); ++i) {
                conflictWarning << burstCapableSymbols[i].first << "(" << burstCapableSymbols[i].second << "%)";
                if (i < burstCapableSymbols.size() - 1) {
                    conflictWarning << ", ";
                }
            }
            
            conflictWarning << ". Combined potential burst load: " << totalPotentialBurstLoad 
                           << "%. Consider burst scheduling or enable burst_together=true "
                           << "to coordinate burst timing.";
            
            // This is informational - let the user decide
            std::cerr << "INFO: " << conflictWarning.str() << std::endl;
        }
        
        // Future: When we add per-symbol burst configuration, validate:
        // 1. Overlapping burst windows between symbols  
        // 2. Maximum concurrent burst intensity limits
        // 3. Burst duration conflicts
        // 4. Market correlation constraints (e.g., don't burst correlated symbols in opposite directions)
        
        // Note: Small symbols (1-4%) can burst without validation concerns
        // The real issue is when large allocations burst independently
    }

    void ConfigFileValidator::validateQuantityMessageCombinations() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        for (const auto& symbolConfig : symbols) {
            // Calculate actual number of messages for this symbol
            size_t symbolMessages = static_cast<size_t>(
                globalConfig._numMessages * (symbolConfig._percentTotalMessages / 100.0)
            );
            
            // Validate minimum quantity vs message count relationship
            if (symbolMessages > 0) {
                // Check if min_quantity is reasonable for the message volume
                // Very high min_quantity with very few messages could be problematic
                if (symbolConfig._quantityRange._minQuantity > 0) {
                    // Calculate total minimum volume for this symbol
                    size_t totalMinVolume = symbolMessages * symbolConfig._quantityRange._minQuantity;
                    
                    // Warn if a symbol with few messages has very high minimum quantities
                    if (symbolMessages < 100 && symbolConfig._quantityRange._minQuantity > 1000) {
                        throw std::runtime_error(
                            "Symbol '" + symbolConfig._symbol + "': High min_quantity (" + 
                            std::to_string(symbolConfig._quantityRange._minQuantity) + 
                            ") with low message count (" + std::to_string(symbolMessages) + 
                            ") may create unrealistic trading patterns. "
                            "Consider increasing percent_num_messages or reducing min_quantity."
                        );
                    }
                    
                    // Check for extremely high volume concentrations
                    if (totalMinVolume > 10000000) {  // 10M+ shares minimum
                        std::cerr << "WARNING: Symbol '" << symbolConfig._symbol 
                                  << "' has very high minimum volume requirement: "
                                  << totalMinVolume << " shares across " << symbolMessages 
                                  << " messages. This may not reflect realistic market conditions."
                                  << std::endl;
                    }
                }
                
                // Validate quantity range spread vs message count
                int quantitySpread = symbolConfig._quantityRange._maxQuantity - symbolConfig._quantityRange._minQuantity;
                if (quantitySpread <= 0) {
                    // This should be caught by earlier validation, but double-check
                    throw std::runtime_error(
                        "Symbol '" + symbolConfig._symbol + "': quantity range is invalid"
                    );
                }
                
                // If we have very few messages but a very wide quantity range,
                // the distribution might not be meaningful
                if (symbolMessages < 10 && quantitySpread > 10000) {
                    std::cerr << "INFO: Symbol '" << symbolConfig._symbol 
                              << "' has only " << symbolMessages << " messages "
                              << "but a wide quantity range (" << quantitySpread << "). "
                              << "Consider more messages for better quantity distribution."
                              << std::endl;
                }
            }
            
            // Validate very small allocations
            if (symbolMessages == 0) {
                throw std::runtime_error(
                    "Symbol '" + symbolConfig._symbol + "': percent_num_messages (" + 
                    std::to_string(symbolConfig._percentTotalMessages) + 
                    "%) results in 0 messages with num_messages=" + 
                    std::to_string(globalConfig._numMessages) + 
                    ". Increase percentage or total message count."
                );
            }
            
            if (symbolMessages == 1 && symbolConfig._quantityRange._minQuantity != symbolConfig._quantityRange._maxQuantity) {
                std::cerr << "INFO: Symbol '" << symbolConfig._symbol 
                          << "' will only generate 1 message, so quantity_range "
                          << "min/max spread will not be utilized effectively."
                          << std::endl;
            }
        }
    }

    void ConfigFileValidator::validateWaveConfiguration() const {
        // Wave mode validation - checks for smooth, realistic wave patterns
        validateWaveAmplitudeAndBaseline();
        validateWaveTimingConflicts();
        validateWaveRealism();
    }

    void ConfigFileValidator::validateWaveAmplitudeAndBaseline() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& waveConfig = _configFileParser.getWaveConfig();
        
        // Validate wave amplitude is within realistic bounds
        if (waveConfig.WaveAmplitudePercent < 50.0) {
            std::cerr << "WARNING: WaveAmplitudePercent (" << waveConfig.WaveAmplitudePercent 
                      << "%) is very low. This creates minimal price variation and may appear unrealistic."
                      << std::endl;
        }
        
        if (waveConfig.WaveAmplitudePercent > 500.0) {
            std::cerr << "ERROR: WaveAmplitudePercent (" << waveConfig.WaveAmplitudePercent 
                      << "%) exceeds maximum safe limit (500%). This creates unrealistic 5x price swings."
                      << std::endl;
        }
        
        // Validate wave duration vs message generation time
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        double estimatedGenerationTimeMs = globalConfig.NumMessages * 0.1; // Rough estimate: 0.1ms per message
        
        if (waveConfig.WaveDurationMs > estimatedGenerationTimeMs * 10) {
            std::cerr << "WARNING: WaveDurationMs (" << waveConfig.WaveDurationMs 
                      << "ms) is much longer than estimated generation time (" 
                      << estimatedGenerationTimeMs << "ms). Wave patterns may not be visible."
                      << std::endl;
        }
        
        // Check for symbol-specific spread vs wave amplitude conflicts
        for (const auto& symbolConfig : symbols) {
            double effectiveVariation = waveConfig.WaveAmplitudePercent * symbolConfig._spreadPercentage / 100.0;
            
            if (effectiveVariation > 50.0) {
                std::cerr << "WARNING: Symbol '" << symbolConfig._symbol 
                          << "' combines high wave amplitude (" << waveConfig.WaveAmplitudePercent 
                          << "%) with high spread (" << symbolConfig._spreadPercentage 
                          << "%), creating extreme price volatility (" << effectiveVariation << "%)."
                          << std::endl;
            }
        }
    }

    void ConfigFileValidator::validateWaveTimingConflicts() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        // Check for wave timing conflicts when waveTogether=false
        // This is similar to burst conflict checking but for smooth waves
        
        size_t significantSymbols = 0;
        double totalWaveLoad = 0.0;
        
        for (const auto& symbolConfig : symbols) {
            if (symbolConfig._percentTotalMessages >= 10.0) {
                significantSymbols++;
                totalWaveLoad += symbolConfig._percentTotalMessages;
            }
        }
        
        // Wave conflicts are less severe than burst conflicts since changes are smooth
        // But still need to consider if multiple large symbols are waving independently
        if (significantSymbols >= 3 && totalWaveLoad > 80.0) {
            std::cerr << "INFO: Wave mode with waveTogether=false and " << significantSymbols 
                      << " significant symbols (" << totalWaveLoad << "% combined load). "
                      << "Independent smooth waves may create complex market patterns. "
                      << "Consider waveTogether=true for more predictable behavior."
                      << std::endl;
        }
    }

    void ConfigFileValidator::validateWaveRealism() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        // Validate that wave parameters create realistic market behavior
        for (const auto& symbolConfig : symbols) {
            // Calculate messages per symbol for wave timing analysis
            size_t symbolMessages = static_cast<size_t>(
                globalConfig._numMessages * (symbolConfig._percentTotalMessages / 100.0)
            );
            
            // For smooth waves, we need enough messages to create smooth transitions
            if (symbolMessages < 50) {
                std::cerr << "WARNING: Symbol '" << symbolConfig._symbol 
                          << "' has only " << symbolMessages << " messages. "
                          << "Wave mode requires sufficient messages for smooth transitions. "
                          << "Consider increasing percent_num_messages for better wave quality."
                          << std::endl;
            }
            
            // TODO: When full wave config is implemented, validate:
            // 1. waveDurationMs vs total generation time
            // 2. waveAmplitudePercent creates realistic price movements
            // 3. waveBaselinePercent doesn't go to zero (no trading halts)
            // 4. waveCycles fit within total generation period
            // 5. Smooth curve parameters don't create unrealistic velocity changes
            
            // Example future validation:
            // if (waveAmplitudePercent > 1000) {
            //     throw std::runtime_error("Wave amplitude > 1000% creates unrealistic 10x swings");
            // }
            // 
            // if (waveBaselinePercent == 0) {
            //     throw std::runtime_error("Wave baseline of 0% would halt all trading at trough");
            // }
            //
            // double velocityChange = waveAmplitudePercent / waveDurationMs;
            // if (velocityChange > MAX_REALISTIC_VELOCITY) {
            //     throw std::runtime_error("Wave transition too rapid for realistic market behavior");
            // }
        }
        
        // Validate cross-symbol wave interactions
        // In wave mode, smooth transitions should maintain market correlation realism
        if (symbols.size() > 1) {
            // Future: Check that independent waves don't create impossible market states
            // e.g., all tech stocks waving down while market indices wave up
        }
    }

    void ConfigFileValidator::validateCombinedModeConfiguration() const {
        // Wave+Burst combined mode validation - ensures realistic interaction between patterns
        validateWaveBurstSynchronization();
        validateCombinedIntensityLimits();
        validateCombinedTimingHarmony();
    }

    void ConfigFileValidator::validateWaveBurstSynchronization() const {
        const auto& symbols = _configFileParser.getSymbols();
        
        // TODO: When full wave+burst config is implemented, validate synchronization
        // For now, validate conceptual conflicts using existing fields
        
        for (const auto& symbolConfig : symbols) {
            // Future validation for wave-burst synchronization:
            // 
            // if (burstOnWavePeaks && burstOnWaveTraoughs) {
            //     throw std::runtime_error("Symbol '" + symbol + "': Cannot burst on both peaks and troughs simultaneously");
            // }
            // 
            // if (burstTogether=false && waveTogether=true) {
            //     warn("Independent bursts on coordinated waves may create unrealistic patterns");
            // }
            // 
            // if (burstTogether=true && waveTogether=false) {
            //     info("Coordinated bursts on independent waves - ensure this matches market intent");
            // }
            
            // Current placeholder validation using spread as synchronization proxy
            if (symbolConfig._spreadPercentage > 5.0) {
                std::cerr << "INFO: Symbol '" << symbolConfig._symbol 
                          << "' has significant spread (" << symbolConfig._spreadPercentage 
                          << "%). In wave+burst mode, ensure burst timing aligns properly "
                          << "with wave phases for realistic market behavior."
                          << std::endl;
            }
        }
    }

    void ConfigFileValidator::validateCombinedIntensityLimits() const {
        const auto& symbols = _configFileParser.getSymbols();
        const auto& globalConfig = _configFileParser.getGlobalConfig();
        
        // Validate that combined wave+burst intensities don't create impossible scenarios
        for (const auto& symbolConfig : symbols) {
            // Calculate potential combined load
            size_t symbolMessages = static_cast<size_t>(
                globalConfig._numMessages * (symbolConfig._percentTotalMessages / 100.0)
            );
            
            // TODO: When full config is implemented, validate combined intensities:
            // 
            // double waveAmplitude = waveConfig.waveAmplitudePercent;  // e.g., 150%
            // double burstIntensity = burstConfig.burstIntensityPercent; // e.g., 500%
            // double combinedPeak = waveAmplitude * (burstIntensity / 100.0); // 150% * 5.0 = 750%
            // 
            // if (combinedPeak > 1000.0) {
            //     throw std::runtime_error("Combined wave+burst intensity (" + 
            //                            std::to_string(combinedPeak) + "%) exceeds 1000% limit");
            // }
            // 
            // double waveTrough = waveConfig.waveBaselinePercent;     // e.g., 75%
            // double combinedTrough = waveTrough * (burstIntensity / 100.0); // 75% * 5.0 = 375%
            // 
            // if (combinedTrough > combinedPeak * 0.8) {
            //     warn("Burst intensity during wave trough approaches peak levels");
            // }
            
            // Current validation using existing fields as intensity proxy
            double proxyIntensity = symbolConfig._spreadPercentage * 10.0; // Rough proxy
            if (symbolMessages > 1000 && proxyIntensity > 50.0) {
                std::cerr << "WARNING: Symbol '" << symbolConfig._symbol 
                          << "' with high message count (" << symbolMessages 
                          << ") and high intensity proxy. In wave+burst mode, "
                          << "ensure combined peak intensity doesn't exceed system capacity."
                          << std::endl;
            }
        }
    }

    void ConfigFileValidator::validateCombinedTimingHarmony() const {
        const auto& symbols = _configFileParser.getSymbols();
        
        // Validate that wave and burst timings work together harmoniously
        for (const auto& symbolConfig : symbols) {
            // TODO: When full timing config is implemented, validate harmony:
            // 
            // double waveDuration = waveConfig.waveDurationMs;      // e.g., 300,000ms (5 min)
            // double burstFrequency = burstConfig.burstFrequencyMs; // e.g., 45,000ms (45 sec)
            // 
            // // Check if burst frequency aligns reasonably with wave cycles
            // double burstsPerWave = waveDuration / burstFrequency;  // 300,000 / 45,000 = 6.67
            // 
            // if (burstsPerWave < 2.0) {
            //     warn("Very few bursts per wave cycle - may not show clear pattern interaction");
            // }
            // 
            // if (burstsPerWave > 20.0) {
            //     warn("Too many bursts per wave cycle - may overwhelm wave pattern");
            // }
            // 
            // // Validate burst duration vs wave smoothness
            // double burstDuration = burstConfig.burstDurationMs;    // e.g., 2,000ms (2 sec)
            // double waveSmoothness = waveConfig.waveSmoothness;     // e.g., 0.8
            // 
            // if (burstDuration > (waveDuration * 0.1)) {
            //     warn("Burst duration > 10% of wave cycle may disrupt smooth wave pattern");
            // }
            // 
            // // Check phase alignment
            // if (burstOnWavePeaks) {
            //     // Validate that bursts enhance rather than fight wave peaks
            //     if (burstIntensity < waveAmplitude) {
            //         info("Burst intensity lower than wave amplitude - bursts may be subtle");
            //     }
            // }
            
            // Current placeholder validation
            std::cerr << "INFO: Symbol '" << symbolConfig._symbol 
                      << "' configured for wave+burst mode. Ensure burst timing "
                      << "harmonizes with wave cycles for optimal market realism."
                      << std::endl;
        }
        
        // Cross-symbol timing validation for combined mode
        if (symbols.size() > 1) {
            // Future: Validate that wave+burst combinations across symbols create coherent market
            // e.g., Don't have MSFT bursting down while AAPL waves up during same time period
            
            std::cerr << "INFO: Multiple symbols in wave+burst mode. Consider correlation "
                      << "between symbols to maintain realistic market behavior patterns."
                      << std::endl;
        }
    }
} // namespace market_data_generator  