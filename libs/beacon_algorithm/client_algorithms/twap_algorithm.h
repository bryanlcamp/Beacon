/*
 * =============================================================================
 * Project:      Beacon
 * Library:      algorithms
 * Purpose:      TWAP algorithm implementation (built-in)
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "../include/beacon_algorithm_setup/base_algorithm.h"
#include <chrono>

namespace beacon::algorithms {

class TwapAlgorithm : public AlgorithmBase {
private:
    double targetVolume_;
    double executedVolume_{0.0};
    std::chrono::steady_clock::time_point startTime_;
    std::chrono::minutes duration_;
    std::string targetSymbol_;
    
public:
    explicit TwapAlgorithm(const nlohmann::json& config) : BaseAlgorithm(config) {
        targetVolume_ = config.value("target_volume", 1000.0);
        int durationMins = config.value("duration_minutes", 30);
        duration_ = std::chrono::minutes(durationMins);
        targetSymbol_ = config.value("symbol", "AAPL");
        startTime_ = std::chrono::steady_clock::now();
    }
    
    void onMarketData(const DecodedMarketMessage& msg) override {
        messagesProcessed_++;
        
        // Only process target symbol
        if (msg.symbol != targetSymbol_) return;
        
        // TWAP logic: spread orders over time
        auto elapsed = std::chrono::steady_clock::now() - startTime_;
        if (elapsed < duration_ && executedVolume_ < targetVolume_) {
            
            // Calculate how much we should have executed by now
            double timeProgress = static_cast<double>(elapsed.count()) / duration_.count();
            double targetExecuted = targetVolume_ * timeProgress;
            
            if (executedVolume_ < targetExecuted - 100) { // Need to catch up
                std::cout << "[TWAP] Need to execute more: target=" << targetExecuted 
                          << " executed=" << executedVolume_ << " symbol=" << msg.symbol << "\n";
                
                // Send order logic would go here
                executedVolume_ += 100; // Simulate execution
            }
        }
    }
    
    std::string getName() const override { return "TWAP"; }
    
    bool isActive() const override {
        auto elapsed = std::chrono::steady_clock::now() - startTime_;
        return elapsed < duration_ && executedVolume_ < targetVolume_ && active_.load();
    }
};

// Auto-register the algorithm
REGISTER_ALGORITHM(TwapAlgorithm, "twap");

} // namespace beacon::algorithms
