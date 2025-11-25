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

#include <unordered_map>
#include <random>
#include <string>
#include <string_view>
#include <vector>
#include <memory>
#include <span>

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

    void GenerateMessages(std::string_view outputPath, size_t numMessages, std::string_view configPath = {});
    [[nodiscard]] size_t GetMessageCount() const noexcept;

private:
    std::vector<SymbolParameters> _symbols;
    StatsManager _statsManager;
    size_t _messageCount = 10000;
    double _tradeProbability = 0.1;
    size_t _flushInterval = 1000;
    std::unique_ptr<beaconserialize::IMarketDataSerializer> _serializer;
    
    // Market state for price generation
    struct MarketState {
        double bidPrice{0.0};
        double askPrice{0.0};
        size_t bidSeqNum{0};
        size_t askSeqNum{0};
    };
    
    // Testable helper methods for core generation logic
    [[nodiscard]] std::pair<double, double> GenerateBidAskPrices(
        const SymbolParameters& symbolParams, 
        std::mt19937& generator) const;
        
    [[nodiscard]] bool ShouldUpdateMarketPrices(
        size_t messageIndex, 
        std::string_view symbol,
        const std::unordered_map<std::string, MarketState>& marketState) const noexcept;
        
    void UpdateMarketState(
        std::string_view symbol,
        double bidPrice,
        double askPrice,
        size_t sequenceNumber,
        std::unordered_map<std::string, MarketState>& marketState) const;
        
    // Extracted methods to break down the massive GenerateMessages function
    [[nodiscard]] std::vector<size_t> CalculateMessageDistribution(size_t numMessages) const;
    void PrintGenerationHeader(size_t numMessages, std::string_view configPath) const;
    void GenerateMessagesForAllSymbols(
        const std::vector<size_t>& messagesPerSymbol,
        size_t numMessages,
        std::unordered_map<std::string, MarketState>& marketState,
        size_t& globalSequenceNumber,
        std::mt19937& generator);
    void GenerateMessagesForSymbol(
        const SymbolParameters& symbolParams,
        size_t messagesForSymbol,
        std::unordered_map<std::string, MarketState>& marketState,
        size_t& globalSequenceNumber,
        std::mt19937& generator);
};

} // namespace beacon::market_data_generator