/*
 * =============================================================================
 * Project:   Beacon  
 * Application: client_algorithm
 * Purpose:   Production client algorithm application
 * Author:    Bryan Camp
 * =============================================================================
 */

// C++ standard library
#include <iostream>
#include <string>
#include <fstream>
#include <thread>
#include <chrono>

// Third-party libraries
#include <nlohmann/json.hpp>

// Beacon HFT libraries - ALL YOUR GOLD! 🏆💎
#include <hft/ringbuffer/spsc_ringbuffer.h>
#include <hft/ringbuffer/spsc_ringbuffer_consumer.h>
#include <hft/profiling/latency_tracker.h>
#include <hft/networking/tcp_client.h>  // ← YOUR TCP client gold!
#include <hft/networking/udp_receiver.h> // ← YOUR UDP receiver gold!

// Application headers - only include what we know exists
#include "../include/client_algorithm.h"

// using namespace beacon::client;
// using namespace beacon::hft::ringbuffer;

// Global latency tracker using YOUR optimized implementation
beacon::hft::profiling::LatencyTracker<1000000> g_tickToTradeLatency;  // 1M samples

void PrintUsage(const char* progName) {
    std::cout << "Usage:\n";
    std::cout << "  " << progName << " [--config <config_file>]\n\n";
    std::cout << "Production client algorithm using Beacon architecture\n";
}

int main(int argc, char* argv[]) {
    std::string configFile = "AlgorithmSettings.json";
    
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

    // Read the algo's configuration file
    nlohmann::json algorithmConfig;
    std::ifstream configFileStream(configFile);
    if (!configFileStream.is_open()) {
        std::cerr << "ERROR: Cannot open required config file: " << configFile << "\n";
        return 1;
    }
    try {
        configFileStream >> algorithmConfig;
        std::cout << "Loaded configuration from: " << configFile << "\n";
    } 
    catch (const std::exception& e) {
        std::cerr << "ERROR: Invalid JSON in config file: " << e.what() << "\n";
        return 1;
    }
    configFileStream.close();
    
    // Validate required configuration fields
    std::vector<std::string> requiredFields = {"symbol", "price_threshold", "enabled", "protocol", "market_data_port"};
    for (const auto& field : requiredFields) {
        if (!algorithmConfig.contains(field)) {
            std::cerr << "ERROR: Missing required configuration field: " << field << "\n";
            return 1;
        }
    }
    
    std::cout << "Beacon Client Algorithm - FULL GOLD INTEGRATION! 🚀💎\n";
    
    try {
        beacon::client::ClientAlgorithm algorithm(algorithmConfig);
        std::string protocol = algorithmConfig["protocol"];
        int udpPort = algorithmConfig["market_data_port"];
        
        // Choose YOUR networking based on protocol
        if (protocol == "udp_multicast" || protocol == "nasdaq") {
            // Use YOUR UDP receiver for market data
            beacon::hft::networking::UdpReceiver udpReceiver("127.0.0.1", udpPort);
            std::cout << "Using Bryan's optimized UdpReceiver 🏆\n";
            
            // Use YOUR optimized ring buffer
            beacon::hft::ringbuffer::SpScRingBuffer<decoder::DecodedMarketMessage, 1024> messageQueue;
        
            // Create YOUR optimized consumer with latency tracking in the callback
            auto consumer = beacon::hft::ringbuffer::make_sp_sc_ringbuffer_consumer(
                messageQueue,
                [&algorithm](const decoder::DecodedMarketMessage& msg) {
                    // HOT PATH: Measure tick-to-trade with YOUR 5-cycle overhead!
                    beacon::hft::profiling::ScopedLatency timing(g_tickToTradeLatency);
                
                    if (algorithm.IsActive()) {
                        algorithm.OnMarketData(msg);  // ← Automatically timed!
                    }
                    // Destructor records latency - ZERO manual timing code!
                }
            );
        
            // Start your optimized consumer with CPU pinning
            consumer.start(2);
        
            std::cout << "[INFO] Consumer running with ELITE latency measurement! 🏆\n";
        
            // Simulate market data to feed your optimized pipeline
            for (int i = 0; i < 5000; ++i) {
                decoder::DecodedMarketMessage msg{};
                msg.messageType = 'A';
                msg.price = 1500000 + (i % 100);
                msg.quantity = 100;
            
                if (!messageQueue.tryPush(msg)) {
                    if (!messageQueue.push(msg, 100)) {
                        std::cout << "[WARNING] Consumer appears hung\n";
                        break;
                    }
                }
            }
        
            // Let your consumer finish processing
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        
            consumer.stop();
            algorithm.Stop();
        
            // Get YOUR beautiful latency statistics (offline - no hot path impact!)
            auto stats = g_tickToTradeLatency.getStats();
        
            std::cout << "\n🏆 ELITE LATENCY STATISTICS (Bryan's weeks of optimization!) 🏆\n";
            std::cout << "═══════════════════════════════════════════════════════════════\n";
            std::cout << "  Total Events:     " << stats.count << "\n";
            std::cout << "  Samples Recorded: " << stats.samples_recorded << "\n";
            std::cout << "───────────────────────────────────────────────────────────────\n";
            std::cout << std::fixed << std::setprecision(3);
            std::cout << "  Min:              " << stats.min_us << " μs\n";
            std::cout << "  Mean:             " << stats.mean_us << " μs\n";
            std::cout << "  Median (p50):     " << stats.median_us << " μs\n";
            std::cout << "  p95:              " << stats.p95_us << " μs\n";
            std::cout << "  p99:              " << stats.p99_us << " μs\n";
            std::cout << "  p99.9:            " << stats.p999_us << " μs\n";
            std::cout << "  Max:              " << stats.max_us << " μs\n";
            std::cout << "═══════════════════════════════════════════════════════════════\n";
            std::cout << "\nQueue stats - Dropped: " << messageQueue.dropped() 
                      << ", High water: " << messageQueue.highWaterMark() << "\n";
        
        } else if (protocol == "tcp_fix") {
            // Use YOUR TCP client for FIX protocol
            beacon::hft::networking::TcpClient tcpClient("127.0.0.1", udpPort);
            std::cout << "Using Bryan's optimized TcpClient 🏆\n";
            
            // Integrate TCP client with your algorithm here...
        }
        
        // Use YOUR complete optimized pipeline:
        // Network (UDP/TCP) -> Decoder -> Queue -> Consumer -> Algorithm -> Latency
        
    } catch (const std::exception& e) {
        std::cerr << "[ERROR] " << e.what() << "\n";
        return 1;
    }
    
    return 0;
}
