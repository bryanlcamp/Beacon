/*
 * =============================================================================
 * Project:      Beacon
 * Library:      algorithms
 * Purpose:      Exapmle usage of implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <beacon_algorithm.h>

namespace beacon::algorithms {

class PovAlgorithm : public BeaconAlgorithmBase {
private:
    std::string _targetSymbol;
    
public:
    explicit PovAlgorithm(const nlohmann::json& config) : BaseAlgorithm(config) {
        // read algo params from config
        _targetSymbol = config.value("symbol", "AAPL");
    }
    
    void onMarketDataReceived(const MarketDataMessage& marketData) override {
        // logic...
    }
    
    void submitOrder() override {
        // ...logic...
    }

    void updateOrder() override {
        // ...logic...
    }

    void cancelOrder() override {
        // ...logic...
    }

    void onOrderAccepted(const Order& order) override {
        // ...logic...
    }

    // Indicates Full or Partial Fill.
    void onOrderFilled(const ExecutionReprt& executionReport) override {
        // ...logic...
    }    

    // We don't have an order it yet.
    void onOrderSubmitRejected(const OrderSubmitRequest& request, const std::string& reason) override {
        // ...logic...
    }

    // We have an order. We have a reason.
    void onOrderUpdateRejected(const OrderUpdateRequest& request) override {
        // ...logic...
    }

    // We have an order. We have a reason. Possibly unsolicited.
    void onOrderCanceled(const CancelReport& cancelReport) override {
        // logic...
    }

    // Required for the base framework.
    std::string getName() const override { return "POV"; }
};

REGISTER_ALGORITHM(PovAlgorithm, "pov");

} // namespace beacon::algorithms
