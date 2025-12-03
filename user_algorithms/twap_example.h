/*
 * =============================================================================
 * Project:      Beacon
 * Purpose:      TWAP Algorithm Example - Header-Only Implementation
 * Author:       Example Implementation
 * 
 * HOW TO CREATE YOUR OWN ALGORITHM - STEP BY STEP:
 * 
 * Step 1: Copy this file to create your algorithm
 *         cp user_algorithms/twap_example.h user_algorithms/my_algo.h
 * 
 * Step 2: Change the class name from TwapExample to YourAlgoName
 *         class MyMomentumAlgo : public BaseAlgorithm {
 * 
 * Step 3: Update the constructor to read your config parameters
 *         myParam_ = config.value("my_param", defaultValue);
 * 
 * Step 4: Implement your trading logic in OnMarketData()
 *         Replace the TWAP logic with your strategy
 * 
 * Step 5: Update GetName() to return your algorithm name
 *         return "MyMomentumAlgo";
 * 
 * Step 6: Update the registration at the bottom
 *         REGISTER_ALGORITHM(MyMomentumAlgo, "my_momentum");
 * 
 * Step 7: Create a config file (copy from config/algorithms/my_strategy_config.json)
 *         Update "name" to match your registration string
 * 
 * Step 8: Include your algorithm in ClientAlgorithmHft.cpp
 *         Add: #include "../../../../user_algorithms/my_algo.h"
 * 
 * Step 9: Run with your config
 *         ./client_algorithm_hft --config config/algorithms/my_config.json
 * 
 * That's it! Your algorithm will get:
 * - Zero-overhead execution (concepts + static polymorphism)  
 * - HFT threading (3-core pinning)
 * - Protocol support (NASDAQ/CME/NYSE)
 * - Performance metrics and statistics
 * =============================================================================
 */

#pragma once

#include <beacon_algorithms/base_algorithm.h>
#include <chrono>
#include <iostream>

namespace beacon::algorithms {

class TwapExample : public BaseAlgorithm {
private:
    // STEP 3: Add your algorithm parameters here (configured via JSON)
    std::string targetSymbol_;
    double targetVolume_;
    std::chrono::minutes duration_;
    
    // STEP 3: Add your runtime state variables here
    double executedVolume_{0.0};
    std::chrono::steady_clock::time_point startTime_;
    
public:
    // STEP 3: Update constructor to read your config parameters
    explicit TwapExample(const nlohmann::json& config) : BaseAlgorithm(config) {
        // Initialize from JSON config - add your parameters here
        targetSymbol_ = config.value("symbol", "AAPL");
        targetVolume_ = config.value("target_volume", 1000.0);
        int durationMins = config.value("duration_minutes", 30);
        duration_ = std::chrono::minutes(durationMins);
        
        startTime_ = std::chrono::steady_clock::now();
        
        std::cout << "[TWAP EXAMPLE] Initialized: " << targetVolume_ 
                  << " shares of " << targetSymbol_ 
                  << " over " << durationMins << " minutes\n";
    }
    
    // STEP 4: Replace this with your trading strategy logic
    void OnMarketData(const DecodedMarketMessage& msg) override {
        messagesProcessed_++;
        
        // Only process our target symbol
        if (msg.symbol != targetSymbol_) return;
        
        // REPLACE THIS SECTION WITH YOUR ALGORITHM LOGIC
        // ================================================
        // TWAP Strategy: Spread execution evenly over time
        auto elapsed = std::chrono::steady_clock::now() - startTime_;
        
        if (elapsed < duration_ && executedVolume_ < targetVolume_) {
            // Calculate how much we should have executed by now
            double timeProgress = static_cast<double>(elapsed.count()) / duration_.count();
            double targetExecuted = targetVolume_ * timeProgress;
            
            // If we're behind schedule, generate an order
            double deficit = targetExecuted - executedVolume_;
            if (deficit >= 100.0) { // Minimum order size
                double orderSize = std::min(deficit, 200.0); // Max 200 shares per order
                
                std::cout << "[TWAP EXAMPLE] Order Signal: " << orderSize 
                          << " shares of " << msg.symbol 
                          << " @ $" << (msg.price / 10000.0) << "\n";
                
                // Simulate execution (in real implementation, send to order management)
                executedVolume_ += orderSize;
            }
        }
        // END OF SECTION TO REPLACE
        // ========================
        
        // Progress reporting (optional - keep or modify)
        if (messagesProcessed_ % 10000 == 0) {
            double progress = (executedVolume_ / targetVolume_) * 100.0;
            std::cout << "[TWAP EXAMPLE] Progress: " << std::fixed << std::setprecision(1) 
                      << progress << "% (" << executedVolume_ << "/" << targetVolume_ << " shares)\n";
        }
    }
    
    // STEP 5: Change this to return your algorithm name
    std::string GetName() const override { return "TwapExample"; }
    
    // STEP 4: Update this method to reflect when your algorithm should stop
    bool IsActive() const override {
        auto elapsed = std::chrono::steady_clock::now() - startTime_;
        bool timeRemaining = elapsed < duration_;
        bool volumeRemaining = executedVolume_ < targetVolume_;
        return timeRemaining && volumeRemaining && active_.load();
    }
};

// STEP 6: Update this registration - first parameter = class name, second = config string
REGISTER_ALGORITHM(TwapExample, "twap_example");

} // namespace beacon::algorithms
