#pragma once
#include <beacon_algorithms/base_algorithm.h>

class MyStrategy : public beacon::algorithms::BaseAlgorithm {
public:
    explicit MyStrategy(const nlohmann::json& config) : BaseAlgorithm(config) {
        // Initialize from config
    }
    
    void onMarketData(const DecodedMarketMessage& msg) override {
        // Your trading logic here
    }
    
    std::string getName() const override { return "MyStrategy"; }
};

REGISTER_ALGORITHM(MyStrategy, "my_strategy");
