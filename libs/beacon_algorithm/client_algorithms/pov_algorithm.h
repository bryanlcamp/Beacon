/*
 * =============================================================================
 * Project:      Beacon
 * Library:      algorithms
 * Purpose:      POV (Percentage of Volume) algorithm implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "../include/beacon_algorithm_setup/base_algorithm.h"

namespace beacon::algorithms {

class PovAlgorithm : public AlgorithmBase {
private:
    double targetPercentage_;
    std::string targetSymbol_;
    double totalMarketVolume_{0.0};
    double executedVolume_{0.0};
    
public:
    explicit PovAlgorithm(const nlohmann::json& config) : BaseAlgorithm(config) {
        targetSymbol_ = config.value("symbol", "AAPL");
        targetPercentage_ = config.value("target_percentage", 10.0);
    }
    
    void onMarketData(const DecodedMarketMessage& msg) override {
        // ...existing POV logic...
    }
    
    std::string getName() const override { return "POV"; }
};

// Auto-register the algorithm
REGISTER_ALGORITHM(PovAlgorithm, "pov");

} // namespace beacon::algorithms
