/*
 * =============================================================================
 * Project:      Beacon
 * Module:       common/configuration
 * Purpose:      Common configuration utilities for all Beacon applications
 * Author:       Bryan Camp
 * =============================================================================
 */

#ifndef BEACON_COMMON_CONFIGURATION_H
#define BEACON_COMMON_CONFIGURATION_H

#include <string>
#include <memory>
#include <nlohmann/json.hpp>

namespace beacon {
namespace common {
namespace configuration {

/**
 * @brief Common configuration paths and utilities for all Beacon applications
 */
class ConfigurationPaths {
public:
    /**
     * @brief Get the configuration file path for a specific application
     * @param applicationName Name of the application (e.g., "ClientAlgorithm", "MatchingEngine")
     * @return Full path to the application's configuration file
     */
    static std::string getApplicationConfigPath(const std::string& applicationName) {
        return "src/apps/common/configuration/" + applicationName + ".json";
    }
    
    /**
     * @brief Get the configuration directory path
     * @return Path to the common configuration directory
     */
    static std::string getConfigurationDirectory() {
        return "src/apps/common/configuration/";
    }
    
    /**
     * @brief Load JSON configuration from file
     * @param configPath Path to the configuration file
     * @return JSON object containing the configuration
     */
    static nlohmann::json loadConfiguration(const std::string& configPath);
    
    /**
     * @brief Check if a configuration file exists
     * @param configPath Path to check
     * @return true if file exists and is readable
     */
    static bool configurationExists(const std::string& configPath);
};

/**
 * @brief Common network configuration structure used across applications
 */
struct NetworkConfig {
    std::string host = "127.0.0.1";  // Default to loopback for security
    int port = 0;
    std::string protocol = "TCP";
    bool enabled = true;
    
    // Factory methods for common configurations
    static NetworkConfig createTcpConfig(int port, const std::string& host = "127.0.0.1");
    static NetworkConfig createUdpConfig(int port, const std::string& host = "127.0.0.1");
};

} // namespace configuration
} // namespace common
} // namespace beacon

#endif // BEACON_COMMON_CONFIGURATION_H