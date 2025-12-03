/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      Implements market data generation with configurable symbol
 *               distribution, realistic bid-ask spread maintenance, and
 *               proper market microstructure simulation.
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <cstddef>
#include <cstdint>
#include <limits>
#include <ostream>
#include <istream>
#include <random>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <random>
#include <sstream>
#include <string_view>
#include <unordered_map>

#include "../include/MessageGenerator.h"
#include "../include/ConfigProvider.h"

namespace beacon::generator {

MessageGenerator::MessageGenerator(const config::ConfigProvider& configProvider)
{
    // Use NEW unified serializer (replaces all old scattered serializers)
    _serializer = configProvider.GetSerializer();
    
    // Use the new methods from ConfigProvider
    auto symbolsForGeneration = configProvider.GetSymbolsForGeneration();
    _messageCount = configProvider.GetMessageCount();
    _tradeProbability = configProvider.GetTradeProbability();
    _flushInterval = configProvider.GetFlushInterval();

    // Convert SymbolData to SymbolParameters using C++20 features
    _symbols.reserve(symbolsForGeneration.size());
    for (const auto& symbolData : symbolsForGeneration) {
        _symbols.emplace_back(SymbolParameters{
            .symbol = symbolData.symbolName,
            .percent = symbolData.weight, // weight field contains the percent (1-100)
            .spread_percent = symbolData.spreadPercent,
            .price_range = {
                .min_price = symbolData.minPrice,
                .max_price = symbolData.maxPrice,
                .weight = 1.0 // Default weight for price generation
            },
            .quantity_range = {
                .min_quantity = 1,
                .max_quantity = 100,
                .weight = 1.0 // Default weight
            }
        });
    }
  }

void MessageGenerator::GenerateTradeMessage(const SymbolParameters& symbolParams, size_t j, GenerationContext& ctx, std::time_t currentTime) {
    auto it = ctx.marketState.find(symbolParams.symbol);
    if (it == ctx.marketState.end()) {
      return;
    }
    const auto& state = it->second;
    double bidPrice = state.bidPrice;
    double askPrice = state.askPrice;
    double tradePrice = (bidPrice + askPrice) / 2.0;
    size_t sourceSeqNum = (j % 2 == 0) ? state.bidSeqNum : state.askSeqNum;
    size_t quantity = 1; // or use a distribution if needed
    
    // Create Message using existing generator format
    Message message;
    message.symbol = symbolParams.symbol;
    message.type = "Trade";
    message.price = tradePrice;
    message.quantity = static_cast<int>(quantity);
    message.sequenceNumber = sourceSeqNum;
    message.timestamp = static_cast<uint64_t>(currentTime);
    message.messageType = MessageType::Last;
    
    // Use NEW unified serializer (replaces old baked-in encoding)
    _serializer->serializeMessage(message);
    
    _statsManager.UpdateTradeStats(symbolParams.symbol, quantity, tradePrice);
    ctx.globalSequenceNumber++;
}

void MessageGenerator::GenerateOrderMessage(
  const SymbolParameters& symbolParams,
  size_t j,
  GenerationContext& ctx)
{
    const auto& priceRange = symbolParams.price_range;
    const auto& quantityRange = symbolParams.quantity_range;
    std::uniform_int_distribution<> quantityDist(quantityRange.min_quantity, quantityRange.max_quantity);

    double bidPrice, askPrice;
    bool shouldUpdatePrices = ShouldUpdateMarketPrices(j, symbolParams.symbol, ctx.marketState);
    if (shouldUpdatePrices) {
      auto [bid, ask] = GenerateBidAskPrices(symbolParams, ctx.generator);
      bidPrice = bid;
      askPrice = ask;
      UpdateMarketState(symbolParams.symbol, bidPrice, askPrice, ctx.globalSequenceNumber, ctx.marketState);
    } else {
      auto& state = ctx.marketState[symbolParams.symbol];
      bidPrice = state.bidPrice;
      askPrice = state.askPrice;
    }
    
    size_t quantity = quantityDist(ctx.generator);
    bool isBuy = (j % 2 == 0);
    beacon::exchanges::protocols::nsdq::common::OrderSide side = isBuy ? 
        beacon::exchanges::protocols::nsdq::common::OrderSide::Buy : 
        beacon::exchanges::protocols::nsdq::common::OrderSide::Sell;
    double price = isBuy ? bidPrice : askPrice;
    size_t sequenceNum = ctx.globalSequenceNumber;

    // Create Message using existing generator format
    Message message;
    message.symbol = symbolParams.symbol;
    message.type = isBuy ? "Buy" : "Sell";
    message.price = price;
    message.quantity = static_cast<int>(quantity);
    message.sequenceNumber = sequenceNum;
    message.timestamp = static_cast<uint64_t>(std::time(nullptr));
    message.messageType = MessageType::Bid;
    
    // Use NEW unified serializer (replaces old baked-in encoding)
    _serializer->serializeMessage(message);
    
    _statsManager.UpdateStats(symbolParams.symbol, isBuy, quantity, price);
    ctx.globalSequenceNumber++;
}

void MessageGenerator::GenerateMessages(std::string_view outputPath, size_t datasetMessageTotal, std::string_view configPath) {
    // Time how long it takess the message generation process
    const auto startTime = std::chrono::high_resolution_clock::now();
    
    // Calculate message distribution across symbols
    const auto messagesPerSymbol = CalculateMessageDistribution(datasetMessageTotal);
    
    // Print generation header and configuration info
    PrintGenerationHeader(datasetMessageTotal, configPath);

    // Initialize generation state
    GenerationContext ctx;
    // Generate all messages
    GenerateMessagesForAllSymbols(messagesPerSymbol, ctx);
    
    // End timing and print results
    const auto endTime = std::chrono::high_resolution_clock::now();
    const std::chrono::duration<double> elapsed = endTime - startTime;
    
    std::cout << "\n>>> File generation complete: " << outputPath << " <<<\n\n";
    _statsManager.PrintStats(datasetMessageTotal, elapsed.count());
  }

std::vector<size_t> MessageGenerator::CalculateMessageDistribution(size_t numMessages) const {
    std::vector<size_t> messagesPerSymbol;
    size_t totalMessagesAssigned = 0;
    
    for (const auto& symbol : _symbols) {
      size_t messagesForSymbol = static_cast<size_t>(std::round(numMessages * (symbol.percent / 100.0)));
      messagesPerSymbol.push_back(messagesForSymbol);
      totalMessagesAssigned += messagesForSymbol;
    }

    // Adjust for rounding errors to ensure the total number of messages matches numMessages
    if (totalMessagesAssigned != numMessages && !messagesPerSymbol.empty()) {
        int adjustment = static_cast<int>(numMessages) - static_cast<int>(totalMessagesAssigned);
        messagesPerSymbol[0] += adjustment;
    }
    
    return messagesPerSymbol;
  }

void MessageGenerator::PrintGenerationHeader(size_t numMessages, std::string_view configPath) const {
    std::cout << "\n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════════════════════════════════\n";
    std::cout << "                        EXCHANGE MARKET DATA GENERATOR - STARTING                                      \n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════════════════════════════════\n\n";
    
    std::cout << "Configuration:\n";
    std::cout << "  Target Messages:    " << numMessages << "\n";
    std::cout << "  Symbols:            ";
    for (size_t i = 0; i < _symbols.size(); ++i) {
      std::cout << _symbols[i].symbol << " (" << _symbols[i].percent << "%)";
      if (i < _symbols.size() - 1) {
        std::cout << ", ";
      }
    }
    std::cout << "\n\n";
    
    if (!configPath.empty()) {
      size_t lastSlash = configPath.find_last_of("/\\");
      const std::string filename = (lastSlash != std::string_view::npos) ? 
          std::string{configPath.substr(lastSlash + 1)} : std::string{configPath};
      std::cout << "Generating messages (using " << filename << ")...\n";
    }
    else {
      std::cout << "Generating messages...\n";
    }
  }

void MessageGenerator::GenerateMessagesForAllSymbols(
  const std::vector<size_t>& messagesPerSymbol,
  GenerationContext& ctx) {
      // Generate messages for each symbol
      for (size_t i = 0; i < _symbols.size(); i++) {
        GenerateMessagesForSymbol(_symbols[i], messagesPerSymbol[i], ctx);
      }
    }

  void MessageGenerator::GenerateMessagesForSymbol(
    const SymbolParameters& symbolParams,
    size_t messagesForSymbol,
    GenerationContext& ctx) {
    const std::time_t currentTime = std::time(nullptr); // Get current time for this symbol
    const auto& priceRange = symbolParams.price_range;
    const auto& quantityRange = symbolParams.quantity_range;
    std::uniform_int_distribution<> quantityDist(quantityRange.min_quantity, quantityRange.max_quantity);

    for (size_t j = 0; j < messagesForSymbol; j++) {
        // Randomly decide if this is a trade using configured probability
        // Decide whether to generate a trade or order message
        bool isTrade = (std::generate_canonical<double, 10>(ctx.generator) < _tradeProbability);
        if (isTrade) {
          // Generate and serialize a trade message
          GenerateTradeMessage(symbolParams, j, ctx, currentTime);
        } else {
          // Generate and serialize an order message
          GenerateOrderMessage(symbolParams, j, ctx);
        }
    }
}

  size_t MessageGenerator::GetMessageCount() const noexcept {
    return _messageCount;
  }

std::pair<double, double> MessageGenerator::GenerateBidAskPrices(
  const SymbolParameters& symbolParams, 
  std::mt19937& generator) {
      
      const auto& priceRange = symbolParams.price_range;
      
      // Generate new prices with proper market microstructure
      // Use weighted random to allow skewing price distribution within range
      const auto randomFactor = std::generate_canonical<double, 10>(generator);
      const auto weightedFactor = std::pow(randomFactor, priceRange.weight);
      const auto basePrice = priceRange.min_price + weightedFactor * (priceRange.max_price - priceRange.min_price);

      // Calculate spread based on symbol's configured spread percentage
      double spread = (priceRange.max_price - priceRange.min_price) * (symbolParams.spread_percent / 100.0);

      // Generate bid and ask with proper spread
      // Bid is below base, ask is above base - maintaining proper market structure
      double bidPrice = std::clamp(basePrice - spread / 2.0, priceRange.min_price, priceRange.max_price);
      double askPrice = std::clamp(basePrice + spread / 2.0, priceRange.min_price, priceRange.max_price);
      
      // Safety check: ensure bid < ask after clamping
      // If clamping causes inversion, push ask up by spread amount
      if (bidPrice >= askPrice) {
          askPrice = bidPrice + spread;
      }
      
      return std::make_pair(bidPrice, askPrice);
  }

  bool MessageGenerator::ShouldUpdateMarketPrices(
    size_t messageIndex, 
    std::string_view symbol,
    const std::unordered_map<std::string, MarketState>& marketState) noexcept {
    return (messageIndex % PRICE_UPDATE_INTERVAL == 0) || !marketState.contains(std::string{symbol});
  }

} // namespace beacon::generator