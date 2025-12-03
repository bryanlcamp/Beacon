/*
 * =============================================================================
 * Project:   Beacon
 * Application: MarketDataReceiver
 * Purpose:   HFT market data receiver using optimized ring buffer
 * Author:    Bryan Camp
 * =============================================================================
 */

// C++ standard library
#include <iostream>
#include <atomic>
#include <fstream>
#include <thread>
#include <chrono>

// Third-party libraries
#include <nlohmann/json.hpp>

// YOUR HFT GOLD - personal optimized components 🏆💎
#include <hft/ringbuffer/spsc_ringbuffer.h>
#include <hft/ringbuffer/spsc_ringbuffer_consumer.h>
#include <hft/concurrency/thread_utils.h>
#include <hft/profiling/latency_tracker.h>

// Your algorithm framework from yesterday's concepts work
#include <beacon_algorithm_setup/base_algorithm.h>
#include "../include/client_algorithm.h"

// Simple message structure (replace with actual library type)
struct DecodedMarketMessage {
    uint64_t timestamp;
    uint32_t price;
    uint32_t quantity;
    char symbol[16];
    uint8_t messageType;
    char side;
    uint8_t symbolLength;
};

// Use YOUR personal optimized SpScRingBuffer 💎
beacon::hft::ringbuffer::SpScRingBuffer<DecodedMarketMessage, 32768> g_MessageQueue;
std::atomic<bool> g_ProcessingActive{false};

// YOUR latency tracking gold
beacon::hft::profiling::LatencyTracker<1000000> g_TickToTradeLatency;

// KEEP THIS WIRING INTACT - this is the critical integration function
template<beacon::algorithms::TradingAlgorithm Algorithm>
void initializeAlgorithmPipeline(const nlohmann::json& config, const std::string& algorithmName) {
    // Create algorithm using your concepts framework (PRESERVE THIS!)
    Algorithm algorithm(config);
    
    // Validate performance at compile-time (your concepts work!)
    static_assert(beacon::algorithms::ValidateAlgorithmPerformance<Algorithm>());
    
    // Wire up YOUR optimized consumer with algorithm + latency tracking
    auto consumer = beacon::hft::ringbuffer::make_sp_sc_ringbuffer_consumer(
        g_MessageQueue,
        [&algorithm](const DecodedMarketMessage& msg) {
            // Hot path with YOUR latency tracking gold
            beacon::hft::profiling::ScopedLatency timing(g_TickToTradeLatency);
            
            // Your optimized algorithm dispatch (PRESERVE THIS WIRING!)
            algorithm.OnMarketData(msg);
        }
    );
    
    // Use YOUR thread utilities for CPU pinning
    consumer.start(2);
    
    std::cout << "[INFO] Algorithm pipeline initialized with YOUR HFT gold: " << algorithm.GetName() << "\n";
    
    // Keep running - this wiring is critical
    while (g_ProcessingActive.load() && algorithm.IsActive()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    consumer.stop();
    
    // Print YOUR latency stats
    auto stats = g_TickToTradeLatency.getStats();
    std::cout << "[INFO] Final latency stats - Mean: " << stats.mean_us 
              << "μs, p99: " << stats.p99_us << "μs\n";
}

void PrintUsage(const char* progName) {
    std::cout << "Usage:\n";
    std::cout << "  " << progName << " [--config <config_file>]\n\n";
    std::cout << "Options:\n";
    std::cout << "  --config   - Network configuration file (default: NetworkSettings.json)\n\n";
}

int main(int argc, char* argv[]) {
    std::string configFile = "NetworkSettings.json";
    
    // Parse command line arguments
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--config" && i + 1 < argc) {
            configFile = argv[++i];
        } else if (arg == "--help" || arg == "-h") {
            PrintUsage(argv[0]);
            return 0;
        } else {
            std::cerr << "ERROR: Unknown argument '" << arg << "'\n\n";
            PrintUsage(argv[0]);
            return 1;
        }
    }
    
    // Load simple configuration
    std::string host = "127.0.0.1";
    int port = 12345;
    std::string protocol = "nasdaq";
    std::string algorithm = "simple";
    
    std::ifstream configFileStream(configFile);
    if (configFileStream.is_open()) {
        nlohmann::json config;
        try {
            configFileStream >> config;
            
            if (config.contains("market_data_receiver")) {
                auto& mdrConfig = config["market_data_receiver"];
                if (mdrConfig.contains("market_data_protocol")) {
                    protocol = mdrConfig["market_data_protocol"];
                }
                if (mdrConfig.contains("input")) {
                    if (mdrConfig["input"].contains("host")) {
                        host = mdrConfig["input"]["host"];
                    }
                    if (mdrConfig["input"].contains("port")) {
                        port = mdrConfig["input"]["port"];
                    }
                }
                if (mdrConfig.contains("algorithm")) {
                    algorithm = mdrConfig["algorithm"];
                }
            }
            
            std::cout << "Loaded configuration from: " << configFile << "\n";
        } catch (const std::exception& e) {
            std::cerr << "ERROR: Invalid JSON in config file: " << e.what() << "\n";
            std::cerr << "Using default settings\n\n";
        }
        configFileStream.close();
    } else {
        std::cerr << "ERROR: Cannot open network config: " << configFile << "\n";
        std::cerr << "Using defaults: TCP 127.0.0.1:12345\n";
        std::cerr << "Note: All Beacon apps use the unified NetworkSettings.json\n\n";
    }
    
    // Algorithm configuration
    nlohmann::json algorithmConfig = {
        {"symbol", "AAPL"},
        {"price_threshold", 100050.0},
        {"enabled", true}
    };
    
    // Parse algorithm config from file if available
    if (configFileStream.is_open()) {
        // Parse algorithm-specific config
        if (config.contains("algorithm_config")) {
            algorithmConfig = config["algorithm_config"];
        }
        if (config.contains("algorithm_type")) {
            algorithmType = config["algorithm_type"];
        }
    }
    
    std::cout << "Starting HFT receiver with YOUR personal optimization gold! 🚀💎\n";
    std::cout << "Protocol: " << protocol << "\n";
    std::cout << "Using: SpScRingBuffer + Consumer + LatencyTracker + ThreadUtils\n\n";
    
    g_ProcessingActive.store(true);
    
    try {
        // Use YOUR algorithm pipeline with concepts framework (PRESERVE THIS!)
        std::thread algorithmThread([&algorithmConfig]() {
            initializeAlgorithmPipeline<beacon::client::ClientAlgorithm>(algorithmConfig, "ClientAlgorithm");
        });
        
        std::cout << "[INFO] HFT receiver ready with YOUR optimization stack!\n";
        
        // Producer loop - feed your optimized consumer
        for (int i = 0; i < 50000; ++i) {
            DecodedMarketMessage msg{};
            msg.timestamp = i;
            msg.price = 1500000 + (i % 100);
            msg.quantity = 100;
            msg.messageType = 'A';
            
            // Use your queue's advanced features
            if (!g_MessageQueue.tryPush(msg)) {
                if (!g_MessageQueue.push(msg, 100)) { // 100ms timeout
                    std::cout << "[ERROR] Consumer hung - breaking\n";
                    break;
                }
            }
            
            if (i % 10000 == 0 && i > 0) {
                std::cout << "[PRODUCER] Generated " << i << " messages, queue size: " 
                          << g_MessageQueue.size() << "\n";
            }
        }
        
        std::cout << "[INFO] Production complete - your consumer is processing!\n";
        
        // Wait for algorithm thread
        if (algorithmThread.joinable()) {
            algorithmThread.join();
        }
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << "\n";
        return 1;
    }
    
    g_ProcessingActive.store(false);
    
    std::cout << "[INFO] Market data receiver stopped\n";
    
    return 0;
}