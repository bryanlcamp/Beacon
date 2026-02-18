#include "ConfigProvider.h"
#include <fstream>
#include <iostream>

namespace beacon { namespace config {

    std::shared_ptr<ConfigProvider> ConfigProvider::instance_ = nullptr;

    std::shared_ptr<ConfigProvider> ConfigProvider::getInstance() {
        if (!instance_) {
            instance_ = std::shared_ptr<ConfigProvider>(new ConfigProvider());
        }
        return instance_;
    }

    bool ConfigProvider::loadConfig(const std::string& config_file) {
        std::ifstream file(config_file);
        if (!file.is_open()) {
            std::cerr << "Failed to open config file: " << config_file << std::endl;
            return false;
        }

        // TODO: Implement JSON parsing
        // For now, set defaults
        algorithm_type_ = "TWAP";
        position_limit_ = 1000000.0;
        risk_limit_ = 500000.0;
        md_host_ = "localhost";
        md_port_ = 9999;
        thread_core_ = 2;
        latency_tracking_ = true;

        return true;
    }

    std::string ConfigProvider::getAlgorithmType() const {
        return algorithm_type_;
    }

    double ConfigProvider::getPositionLimit() const {
        return position_limit_;
    }

    double ConfigProvider::getRiskLimit() const {
        return risk_limit_;
    }

    std::string ConfigProvider::getMarketDataHost() const {
        return md_host_;
    }

    int ConfigProvider::getMarketDataPort() const {
        return md_port_;
    }

    int ConfigProvider::getThreadAffinityCore() const {
        return thread_core_;
    }

    bool ConfigProvider::isLatencyTrackingEnabled() const {
        return latency_tracking_;
    }

}}
