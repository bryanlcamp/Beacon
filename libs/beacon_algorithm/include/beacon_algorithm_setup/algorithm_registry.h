/*
 * =============================================================================
 * Project:      Beacon
 * Library:      algorithms
 * Purpose:      Plugin registry for trading algorithms
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <string>
#include <functional>
#include <unordered_map>
#include <memory>
#include <vector>
#include <nlohmann/json.hpp>

namespace beacon::algorithms {

// Forward declaration
struct DecodedMarketMessage;

// Concept for trading algorithms (updated to match base_algorithm.h)
template<typename T>
concept TradingAlgorithm = requires(T algo, const DecodedMarketMessage& msg) {
    { algo.OnMarketData(msg) } -> std::same_as<void>;
    { algo.GetName() } -> std::same_as<std::string_view>;
    { algo.IsActive() } -> std::same_as<bool>;
};

// Algorithm factory function type - using template for the run function
template<typename QueueType>
using AlgorithmFactory = std::function<void(QueueType&, const nlohmann::json&)>;

// Global algorithm registry
class AlgorithmRegistry {
public:
    static AlgorithmRegistry& instance();
    
    // Register an algorithm factory
    template<typename QueueType>
    void RegisterAlgorithm(const std::string& name, AlgorithmFactory<QueueType> factory);
    
    // Create and run an algorithm - using template for the run function
    template<typename QueueType, typename RunFunc>
    void CreateAndRun(const std::string& name, QueueType& queue, const nlohmann::json& config, 
                      RunFunc&& runFunc);
    
    // List available algorithms
    std::vector<std::string> GetAvailableAlgorithms() const;

private:
    std::unordered_map<std::string, std::function<void()>> _factories;
    
    AlgorithmRegistry() = default;
};

// Registration macro for easy algorithm registration
#define REGISTER_ALGORITHM(AlgoType, name) \
    namespace { \
        struct AlgoType##Registrar { \
            AlgoType##Registrar() { \
                /* Registration will be implemented when the queue type is defined */ \
            } \
        }; \
        static AlgoType##Registrar g_##AlgoType##Registrar; \
    }

} // namespace beacon::algorithms
