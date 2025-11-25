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

#include "../include/MessageGenerator.h"
#include "../include/ConfigProvider.h"
#include "../include/serializers/MarketDataSerializer.h"

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
#include <ranges>

namespace beaconserialize = beacon::market_data_generator::serializers;
namespace beaconconfig = beacon::market_data_generator::config;

// Constants for message generation
static constexpr size_t PRICE_UPDATE_INTERVAL = 10; // Update market every 10 messages

namespace beacon::market_data_generator {

  MessageGenerator::MessageGenerator(const beaconconfig::ConfigProvider& configProvider)
  {
    // Get the serializer from the config provider
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

  void MessageGenerator::GenerateMessages(std::string_view outputPath, size_t numMessages, std::string_view configPath) {
    // Start timing
    const auto startTime = std::chrono::high_resolution_clock::now();
    
    // Calculate message distribution across symbols
    const auto messagesPerSymbol = CalculateMessageDistribution(numMessages);
    
    // Print generation header and configuration info
    PrintGenerationHeader(numMessages, configPath);

    // Initialize generation state
    std::mt19937 generator{std::random_device{}()};
    std::unordered_map<std::string, MarketState> marketState;
    size_t globalSequenceNumber = 1;
    
    // Generate all messages
    GenerateMessagesForAllSymbols(messagesPerSymbol, numMessages, marketState, globalSequenceNumber, generator);
    
    // End timing and print results
    const auto endTime = std::chrono::high_resolution_clock::now();
    const std::chrono::duration<double> elapsed = endTime - startTime;
    
    std::cout << "\n>>> File generation complete: " << outputPath << " <<<\n\n";
    _statsManager.PrintStats(numMessages, elapsed.count());
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
    if (totalMessagesAssigned != numMessages) {
      if (totalMessagesAssigned < numMessages) {
        size_t adjustment = numMessages - totalMessagesAssigned;
        messagesPerSymbol[0] += adjustment;
      }
      else {
        size_t adjustment = totalMessagesAssigned - numMessages;
        messagesPerSymbol[0] -= adjustment;
      }
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
      size_t numMessages,
      std::unordered_map<std::string, MarketState>& marketState,
      size_t& globalSequenceNumber,
      std::mt19937& generator) {
      
      // Generate messages for each symbol
      for (size_t i = 0; i < _symbols.size(); i++) {
          GenerateMessagesForSymbol(_symbols[i], messagesPerSymbol[i], marketState, globalSequenceNumber, generator);
      }
  }

  void MessageGenerator::GenerateMessagesForSymbol(
      const SymbolParameters& symbolParams,
      size_t messagesForSymbol,
      std::unordered_map<std::string, MarketState>& marketState,
      size_t& globalSequenceNumber,
      std::mt19937& generator) {

          const std::time_t currentTime = std::time(nullptr); // Get current time for this symbol

          const auto& priceRange = symbolParams.price_range;
          const auto& quantityRange = symbolParams.quantity_range;

          // Define a uniform distribution for quantities
          std::uniform_int_distribution<> quantityDist(quantityRange.min_quantity, quantityRange.max_quantity);

          // Calculate spread based on symbol's configured spread percentage
          // Example: For a $100-$200 range with 0.5% spread, spread = $0.50
          // This creates realistic bid-ask spreads proportional to the price level
          double spread = (priceRange.max_price - priceRange.min_price) * (symbolParams.spread_percent / 100.0);

          for (size_t j = 0; j < messagesForSymbol; j++) {
              // Randomly decide if this is a trade using configured probability
              bool isTrade = (std::generate_canonical<double, 10>(generator) < _tradeProbability);
              
              double bidPrice, askPrice;
              size_t sourceSeqNum = 0;
              double tradePrice = 0.0;

              if (isTrade) {
                // For trades, use the current market state
                auto it = marketState.find(symbolParams.symbol);
                if (it != marketState.end()) {
                    const auto& state = it->second;
                    bidPrice = state.bidPrice;
                    askPrice = state.askPrice;
                    tradePrice = (bidPrice + askPrice) / 2.0; // Trade at midpoint
                    sourceSeqNum = (j % 2 == 0) ? state.bidSeqNum : state.askSeqNum;
                }
                else {
                    // No market state yet, skip this trade
                    continue;
                }
              }
              else {
                // For orders, update market prices periodically to create realistic price movement
                // This ensures bid and ask move together (not independently on each message)
                bool shouldUpdatePrices = ShouldUpdateMarketPrices(j, symbolParams.symbol, marketState);
                
                if (shouldUpdatePrices) {
                    // Generate new bid/ask prices using extracted method
                    auto priceResult = GenerateBidAskPrices(symbolParams, generator);
                    bidPrice = priceResult.first;
                    askPrice = priceResult.second;
                    
                    // Update market state using extracted method
                    UpdateMarketState(symbolParams.symbol, bidPrice, askPrice, globalSequenceNumber, marketState);
                }
                else {
                    // Use existing market prices (bid and ask stay consistent)
                    auto& state = marketState[symbolParams.symbol];
                    bidPrice = state.bidPrice;
                    askPrice = state.askPrice;
                }
              }

              // Generate a quantity using the uniform distribution
              size_t quantity = quantityDist(generator);

              // Create the message with explicit logic instead of nested ternaries
              MessageType messageType;
              std::string side;
              double price;
              size_t sequenceNum;
              
              if (isTrade) {
                  messageType = MessageType::Last;
                  side = "Trade";
                  price = tradePrice;
                  sequenceNum = sourceSeqNum;
              }
              else {
                  // Determine if this is a bid (buy) or ask (sell) order
                  bool isBuy = (j % 2 == 0);
                  messageType = isBuy ? MessageType::Bid : MessageType::Ask;
                  side = isBuy ? "Buy" : "Sell";
                  price = isBuy ? bidPrice : askPrice;
                  sequenceNum = globalSequenceNumber;
              }
              
              Message message(
                  symbolParams.symbol,
                  messageType,
                  side,
                  quantity,
                  price,
                  sequenceNum,
                  currentTime
              );

              _serializer->serializeMessage(message);
              
              // Update statistics
              if (isTrade) {
                  _statsManager.UpdateTradeStats(symbolParams.symbol, quantity, tradePrice);
              }
              else {
                  bool isBuy = (j % 2 == 0);
                  double price = isBuy ? bidPrice : askPrice;
                  _statsManager.UpdateStats(symbolParams.symbol, isBuy, quantity, price);
              }

              // Increment the global sequence number
              globalSequenceNumber++;
          }
  }

  size_t MessageGenerator::GetMessageCount() const noexcept {
      return _messageCount;
  }

  std::pair<double, double> MessageGenerator::GenerateBidAskPrices(
      const SymbolParameters& symbolParams, 
      std::mt19937& generator) const {
      
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
      const std::unordered_map<std::string, MarketState>& marketState) const noexcept {
      
      return (messageIndex % PRICE_UPDATE_INTERVAL == 0) || !marketState.contains(std::string{symbol});
  }

  void MessageGenerator::UpdateMarketState(
      std::string_view symbol,
      double bidPrice,
      double askPrice,
      size_t sequenceNumber,
      std::unordered_map<std::string, MarketState>& marketState) const {
      
      auto& state = marketState[std::string{symbol}];
      state.bidPrice = bidPrice;
      state.askPrice = askPrice;
      state.bidSeqNum = sequenceNumber;
      state.askSeqNum = sequenceNumber;
  }

} // namespace beacon::market_data_generator