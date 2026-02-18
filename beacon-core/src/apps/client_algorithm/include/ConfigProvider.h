#pragma once
#include <string>
#include <memory>

namespace beacon { namespace config {

    class ConfigProvider {
    public:
        static std::shared_ptr<ConfigProvider> getInstance();

        // Configuration loading
        bool loadConfig(const std::string& config_file);

        // Algorithm settings
        std::string getAlgorithmType() const;
        double getPositionLimit() const;
        double getRiskLimit() const;

        // Market data settings
        std::string getMarketDataHost() const;
        int getMarketDataPort() const;

        // Performance settings
        int getThreadAffinityCore() const;
        bool isLatencyTrackingEnabled() const;

    private:
        ConfigProvider() = default;
        static std::shared_ptr<ConfigProvider> instance_;

        // Configuration data
        std::string algorithm_type_;
        double position_limit_;
        double risk_limit_;
        std::string md_host_;
        int md_port_;
        int thread_core_;
        bool latency_tracking_;
    };

}}
