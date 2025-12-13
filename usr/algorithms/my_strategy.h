#pragma once

#include <user_algorithms/base_algorithm.h>

class MyStrategy : public user_algorithms::BaseAlgorithm {
public:
    explicit MyStrategy(const nlohmann::json& config) : BaseAlgorithm(config) {
        // Initialize from config
    }
    
    void onMarketDataReceived(const MarketMessage& marketMsg) override {
        // Your trading logic here
        // 3-tier, extendable, overrideable provided. checkRisk(marketMsg);
        // submitOrder(), updateOrder, cancelOrder,
    }
    
    void onOrderConfirmed(const Order& firm) override {
        // Your trading logic here
    }

    void onOrderFiled(const OrderFill& fill) override {
        // Your trading logic here
    }

    void onOrderRejected(const OrderRequest& request) override {
        // Your trading logic here
    }

    void onExchangeMessageReceived(const ExchangeMessage& exchMsg) override {
        // Your trading logic here
    }
};

// Hide concepts and template polymorphism complexity.
REGISTER_ALGORITHM(MyStrategy);