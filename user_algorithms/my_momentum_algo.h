#pragma once

#include <beacon_algorithms/base_algorithm.h>
#include <deque>

class MyMomentumAlgorithm : public beacon::algorithms::BaseAlgorithm {
private:
    std::string targetSymbol_;
    std::deque<double> priceHistory_;
    size_t windowSize_;
    double momentumThreshold_;
    
public:
    explicit MyMomentumAlgorithm(const nlohmann::json& config) : BaseAlgorithm(config) {
        targetSymbol_ = config.value("symbol", "AAPL");
        windowSize_ = config.value("window_size", 10);
        momentumThreshold_ = config.value("momentum_threshold", 0.01);
    }
    
    void onMarketData(const DecodedMarketMessage& msg) override {
        if (msg.symbol != targetSymbol_) return;
        
        double price = msg.price / 10000.0;
        priceHistory_.push_back(price);
        
        if (priceHistory_.size() > windowSize_) {
            priceHistory_.pop_front();
        }
        
        if (priceHistory_.size() == windowSize_) {
            double momentum = (priceHistory_.back() - priceHistory_.front()) / priceHistory_.front();
            
            if (std::abs(momentum) > momentumThreshold_) {
                std::cout << "[MOMENTUM] " << (momentum > 0 ? "UP" : "DOWN") 
                          << " " << (momentum * 100) << "% on " << msg.symbol << "\n";
                // Trading logic here
            }
        }
    }
    
    std::string getName() const override { return "MyMomentum"; }
};

// Auto-register the algorithm
REGISTER_ALGORITHM(MyMomentumAlgorithm, "my_momentum");
