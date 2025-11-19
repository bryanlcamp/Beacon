/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      Orchestrates market data message generation with realistic
 *               market microstructure (bid-ask spreads, trades, order flow)
 *               and statistical tracking.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "StatsManager.h"
#include "SymbolParameters.h"
#include "serializers/MarketDataSerializer.h"
#include "ConfigProvider.h"
#include "ConfigFileParser.h"

#include <string>
#include <vector>
#include <memory>

namespace beaconserialize = beacon::market_data_generator::serializers;
namespace beaconconfig = beacon::market_data_generator::config;

namespace beacon::market_data_generator {

class MessageGenerator {
public:
    explicit MessageGenerator(const beaconconfig::ConfigProvider& configProvider);

    // Delete unwanted constructors
    MessageGenerator() = delete;
    MessageGenerator(const MessageGenerator&) = delete;
    MessageGenerator& operator=(const MessageGenerator&) = delete;
    MessageGenerator(MessageGenerator&&) = delete;
    MessageGenerator& operator=(MessageGenerator&&) = delete;

    void generateMessages(const std::string& outputPath, size_t numMessages, const std::string& configPath = "");
    size_t getMessageCount() const;

private:
    std::vector<SymbolParameters> _symbols;
    StatsManager _statsManager;
    size_t _messageCount = 10000;
    double _tradeProbability = 0.1;
    size_t _flushInterval = 1000;
    std::unique_ptr<beaconserialize::IMarketDataSerializer> _serializer;
    
    // Wave and burst configuration
    ::market_data_generator::ConfigFileParser::WaveConfig _waveConfig;
    ::market_data_generator::ConfigFileParser::BurstConfig _burstConfig;
    
    // Helper methods for wave and burst generation
    double calculateWaveAmplitude(size_t messageIndex, size_t totalMessages) const;
    bool shouldGenerateBurst(size_t messageIndex) const;
    double calculateBurstIntensity(size_t messageIndex, size_t burstStart) const;
};

} // namespace beacon::market_data_generator