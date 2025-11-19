/*
 * =============================================================================
 * Project:      Beacon
 * Module:       common/configuration
 * Purpose:      Implementation of common configuration utilities
 * Author:       Bryan Camp
 * =============================================================================
 */

#include "configuration.h"
#include <fstream>
#include <iostream>
#include <filesystem>

namespace beacon {
namespace common {
namespace configuration {

nlohmann::json ConfigurationPaths::loadConfiguration(const std::string& configPath) {
    try {
        std::ifstream file(configPath);
        if (!file.is_open()) {
            throw std::runtime_error("Cannot open configuration file: " + configPath);
        }
        
        nlohmann::json config;
        file >> config;
        return config;
    } catch (const std::exception& e) {
        std::cerr << "[CONFIG ERROR] Failed to load configuration from " << configPath 
                  << ": " << e.what() << std::endl;
        throw;
    }
}

bool ConfigurationPaths::configurationExists(const std::string& configPath) {
    return std::filesystem::exists(configPath) && std::filesystem::is_regular_file(configPath);
}

NetworkConfig NetworkConfig::createTcpConfig(int port, const std::string& host) {
    NetworkConfig config;
    config.host = host;
    config.port = port;
    config.protocol = "TCP";
    config.enabled = true;
    return config;
}

NetworkConfig NetworkConfig::createUdpConfig(int port, const std::string& host) {
    NetworkConfig config;
    config.host = host;
    config.port = port;
    config.protocol = "UDP";
    config.enabled = true;
    return config;
}

} // namespace configuration
} // namespace common
} // namespace beacon