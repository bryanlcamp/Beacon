/*
 * =============================================================================
 * Project:      Beacon
 * Application:  generator
 * Purpose:      Orchestrates market data message generation with realistic
 *               market microstructure (bid-ask spreads, trades, order flow)
 *               and statistical tracking.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <random>
#include <string>
#include <string_view>
#include <time.h>
#include <unordered_map>
#include <vector>

#include "SymbolParameters.h"
#include "StatsManager.h"

// Forward declarations with correct namespaces
namespace beacon { namespace generator { namespace config { class ConfigProvider; }}}
namespace beacon { namespace generator { class UnifiedMarketDataSerializer; }}

namespace beacon::generator {

struct MarketState {
    double bidPrice{0.0};
    double askPrice{0.0};
    size_t bidSeqNum{0};
    size_t askSeqNum{0};
};

struct GenerationContext {
    std::unordered_map<std::string, MarketState> marketState;
    size_t globalSequenceNumber = 1;
    std::mt19937 generator{std::random_device{}()};
};

/**
 * @class MessageGenerator
 * @brief Orchestrates the generation of synthetic market data messages for multiple symbols.
 */
class MessageGenerator {
public:
    // Updated namespace - use beacon::generator::config instead of beacon::market_data_generator::config
    explicit MessageGenerator(const beacon::generator::config::ConfigProvider& configProvider);

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
    
    // Use your new UnifiedMarketDataSerializer instead of old interface
    std::unique_ptr<beacon::generator::UnifiedMarketDataSerializer> _serializer;


    /**
     * @brief Helper to generate an order message (buy/sell) for a symbol and update stats.
     * @param symbolParams Parameters for the symbol.
     * @param j Message index for the symbol.
     * @param ctx Generation context (market state, RNG, sequence number).
     */
    void GenerateOrderMessage(
        const SymbolParameters& symbolParams,
        size_t j,
        GenerationContext& ctx);

    // Testable helper methods for core generation logic
    /**
     * @brief Generate new bid/ask prices for a symbol using randomization within allowed ranges.
     * @param symbolParams Parameters for the symbol.
     * @param generator Random number generator.
     * @return Pair of (bid, ask) prices.
     */
    static std::pair<double, double> GenerateBidAskPrices(
        const SymbolParameters& symbolParams, 
        std::mt19937& generator);

    /**
     * @brief Decide if market prices should be updated for this message index.
     * @param messageIndex Index of the message for the symbol.
     * @param symbol Symbol name.
     * @param marketState Current market state map.
     * @return True if prices should be updated, false otherwise.
     */
    static bool ShouldUpdateMarketPrices(
        size_t messageIndex, 
        std::string_view symbol,
        const std::unordered_map<std::string, MarketState>& marketState) noexcept;

    /**
     * @brief Update the market state for a symbol with new prices and sequence number.
     * @param symbol Symbol name.
     * @param bidPrice New bid price.
     * @param askPrice New ask price.
     * @param sequenceNumber Sequence number to set.
     * @param marketState Market state map to update.
     */
    static void UpdateMarketState(
        std::string_view symbol,
        double bidPrice,
        double askPrice,
        size_t sequenceNumber,
        std::unordered_map<std::string, MarketState>& marketState);
        
    // Extracted methods to break down the massive GenerateMessages function
    [[nodiscard]] std::vector<size_t> CalculateMessageDistribution(size_t numMessages) const;
    
    void PrintGenerationHeader(size_t numMessages, std::string_view configPath) const;

    void GenerateMessagesForAllSymbols(
        const std::vector<size_t>& messagesPerSymbol,
        GenerationContext& ctx);

    void GenerateMessagesForSymbol(
        const SymbolParameters& symbolParams,
        size_t messagesForSymbol,
        GenerationContext& ctx);
};

} // namespace beacon::generator