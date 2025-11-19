/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Factory for creating playback rules from configuration
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <memory>
#include <string>
#include <fstream>
#include <nlohmann/json.hpp>

#include <IPlaybackRule.h>
#include "BurstRule.h"
#include "WaveRule.h"

namespace playback::rules {

/**
 * @brief Factory class for creating playback rules from JSON configuration
 */
class RuleFactory {
public:
    /**
     * Create a rule from a JSON configuration file
     * @param configPath Path to the JSON configuration file
     * @return Unique pointer to the created rule, or nullptr if creation failed
     */
    static std::unique_ptr<IPlaybackRule> createFromConfig(const std::string& configPath) {
        try {
            std::ifstream file(configPath);
            if (!file.is_open()) {
                std::cerr << "[RULE FACTORY ERROR] Cannot open config file: " << configPath << std::endl;
                return nullptr;
            }
            
            nlohmann::json config;
            file >> config;
            
            std::string mode = config.value("mode", "");
            std::string type = config.value("type", "");
            
            // Support both "mode" and "type" fields for compatibility
            std::string ruleType = !mode.empty() ? mode : type;
            
            if (ruleType == "burst" || ruleType == "burst_rule") {
                return createBurstRule(config);
            } else if (ruleType == "wave" || ruleType == "wave_rule") {
                return createWaveRule(config);
            } else {
                std::cerr << "[RULE FACTORY ERROR] Unknown rule type: " << ruleType << std::endl;
                return nullptr;
            }
            
        } catch (const std::exception& e) {
            std::cerr << "[RULE FACTORY ERROR] Failed to parse config " << configPath 
                      << ": " << e.what() << std::endl;
            return nullptr;
        }
    }

private:
    /**
     * Create a burst rule from JSON configuration
     */
    static std::unique_ptr<IPlaybackRule> createBurstRule(const nlohmann::json& config) {
        // Extract burst parameters with sensible defaults
        size_t burstSize = config.value("burstSize", 1000);
        int burstIntervalMs = config.value("burstIntervalMs", 1000);
        double speedFactor = config.value("speedFactor", 1.0);
        size_t maxRateLimit = config.value("maxRateLimit", 50000);
        
        // Validation
        if (burstSize == 0) {
            std::cerr << "[BURST RULE WARNING] burstSize is 0, setting to 1" << std::endl;
            burstSize = 1;
        }
        
        if (burstIntervalMs <= 0) {
            std::cerr << "[BURST RULE WARNING] burstIntervalMs is <= 0, setting to 100ms" << std::endl;
            burstIntervalMs = 100;
        }
        
        if (speedFactor <= 0) {
            std::cerr << "[BURST RULE WARNING] speedFactor is <= 0, setting to 1.0" << std::endl;
            speedFactor = 1.0;
        }
        
        std::cout << "[RULE FACTORY] Creating BurstRule: size=" << burstSize 
                  << ", interval=" << burstIntervalMs << "ms"
                  << ", speed=" << speedFactor
                  << ", maxRate=" << maxRateLimit << std::endl;
        
        return std::make_unique<BurstRule>(
            burstSize,
            std::chrono::milliseconds(burstIntervalMs),
            speedFactor,
            maxRateLimit
        );
    }
    
    /**
     * Create a wave rule from JSON configuration
     */
    static std::unique_ptr<IPlaybackRule> createWaveRule(const nlohmann::json& config) {
        // Extract wave parameters with sensible defaults
        int periodMs = config.value("periodMs", 10000);      // 10 second default cycle
        double minRate = config.value("minRate", 100.0);     // 100 msg/s minimum
        double maxRate = config.value("maxRate", 10000.0);   // 10,000 msg/s maximum
        double speedFactor = config.value("speedFactor", 1.0);
        
        // Validation
        if (periodMs <= 0) {
            std::cerr << "[WAVE RULE WARNING] periodMs is <= 0, setting to 10000ms" << std::endl;
            periodMs = 10000;
        }
        
        if (minRate < 0) {
            std::cerr << "[WAVE RULE WARNING] minRate is < 0, setting to 0" << std::endl;
            minRate = 0;
        }
        
        if (maxRate < minRate) {
            std::cerr << "[WAVE RULE WARNING] maxRate < minRate, setting maxRate to " << minRate << std::endl;
            maxRate = minRate;
        }
        
        if (speedFactor <= 0) {
            std::cerr << "[WAVE RULE WARNING] speedFactor is <= 0, setting to 1.0" << std::endl;
            speedFactor = 1.0;
        }
        
        std::cout << "[RULE FACTORY] Creating WaveRule: period=" << periodMs << "ms"
                  << ", minRate=" << minRate 
                  << ", maxRate=" << maxRate
                  << ", speed=" << speedFactor << std::endl;
        
        return std::make_unique<WaveRule>(
            std::chrono::milliseconds(periodMs),
            minRate,
            maxRate,
            speedFactor
        );
    }
};

} // namespace playback::rules