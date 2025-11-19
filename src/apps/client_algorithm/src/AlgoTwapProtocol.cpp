/*
 * =============================================================================
 * Project:      Beacon
 * Application:  client_algorithm
 * File:         AlgoTwapProtocol.cpp
 * Purpose:      Modern TWAP algorithm with protocol-aware order execution
 * 
 * Features:
 * - Protocol-agnostic design (supports OUCH, Pillar, CME)
 * - Configuration-driven protocol selection
 * - Proper binary protocol message formatting
 * - TCP connection to matching engine
 * - Centralized configuration management
 * 
 * Usage:
 * ./algo_twap_protocol --config <config_file> --symbol <symbol> --side <B/S> --shares <count> --price <price>
 * 
 * Examples:
 * ./algo_twap_protocol --config src/apps/common/configuration/ClientAlgorithm.Twap.json --symbol AAPL --side B --shares 10000 --price 150.25
 * 
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <iostream>
#include <iomanip>
#include <string>
#include <memory>
#include <csignal>
#include <thread>
#include <chrono>
#include <getopt.h>
#include "TwapProtocolExecutor.h"

using namespace beacon::client_algorithm::twap;

// Global variables for signal handling
std::unique_ptr<TwapProtocolExecutor> g_executor;
std::atomic<bool> g_running{true};

void signalHandler(int signal) {
    std::cout << "\n[MAIN] Received signal " << signal << ", shutting down...\n";
    g_running.store(false);
    if (g_executor) {
        g_executor->stopExecution();
    }
}

void printUsage(const char* program_name) {
    std::cout << "\n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
    std::cout << "                    BEACON TWAP PROTOCOL EXECUTOR                           \n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
    std::cout << "\n";
    std::cout << "DESCRIPTION:\n";
    std::cout << "  Time-Weighted Average Price (TWAP) algorithm with protocol-aware execution.\n";
    std::cout << "  Supports NASDAQ OUCH v5.0, NYSE Pillar v3.2, and CME iLink 3 protocols.\n";
    std::cout << "  Sends binary protocol messages via TCP to matching engine.\n";
    std::cout << "\n";
    std::cout << "USAGE:\n";
    std::cout << "  " << program_name << " [OPTIONS]\n";
    std::cout << "\n";
    std::cout << "REQUIRED OPTIONS:\n";
    std::cout << "  --config <file>     Configuration file path\n";
    std::cout << "  --symbol <symbol>   Stock symbol (e.g., AAPL, MSFT)\n";
    std::cout << "  --side <B|S>        Order side: B=Buy, S=Sell\n";
    std::cout << "  --shares <count>    Total shares to execute\n";
    std::cout << "  --price <price>     Limit price in dollars (e.g., 150.25)\n";
    std::cout << "\n";
    std::cout << "OPTIONAL:\n";
    std::cout << "  --help             Show this help message\n";
    std::cout << "\n";
    std::cout << "EXAMPLES:\n";
    std::cout << "  # Execute 10,000 AAPL shares using OUCH protocol\n";
    std::cout << "  " << program_name << " \\\n";
    std::cout << "    --config src/apps/common/configuration/ClientAlgorithm.Twap.json \\\n";
    std::cout << "    --symbol AAPL --side B --shares 10000 --price 150.25\n";
    std::cout << "\n";
    std::cout << "  # Execute 5,000 ES futures using CME protocol\n";
    std::cout << "  " << program_name << " \\\n";
    std::cout << "    --config /path/to/cme_twap_config.json \\\n";
    std::cout << "    --symbol ESZ4 --side S --shares 5000 --price 4250.50\n";
    std::cout << "\n";
    std::cout << "CONFIGURATION:\n";
    std::cout << "  The configuration file determines:\n";
    std::cout << "  - Protocol type (OUCH, Pillar, CME)\n";
    std::cout << "  - Network endpoints (market data + order entry)\n";
    std::cout << "  - TWAP algorithm parameters\n";
    std::cout << "  - Risk controls and execution strategy\n";
    std::cout << "\n";
}

struct ProgramArgs {
    std::string config_file;
    std::string symbol;
    char side = 0;
    uint64_t shares = 0;
    double price = 0.0;
    bool show_help = false;
    bool valid = false;
};

ProgramArgs parseArgs(int argc, char* argv[]) {
    ProgramArgs args;
    
    static struct option long_options[] = {
        {"config", required_argument, 0, 'c'},
        {"symbol", required_argument, 0, 's'},
        {"side",   required_argument, 0, 'd'},
        {"shares", required_argument, 0, 'n'},
        {"price",  required_argument, 0, 'p'},
        {"help",   no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };
    
    int option_index = 0;
    int c;
    
    while ((c = getopt_long(argc, argv, "c:s:d:n:p:h", long_options, &option_index)) != -1) {
        switch (c) {
            case 'c':
                args.config_file = optarg;
                break;
            case 's':
                args.symbol = optarg;
                break;
            case 'd':
                if (std::strlen(optarg) == 1 && (optarg[0] == 'B' || optarg[0] == 'S')) {
                    args.side = optarg[0];
                } else {
                    std::cerr << "[ERROR] Invalid side '" << optarg << "'. Must be 'B' or 'S'\n";
                    return args;
                }
                break;
            case 'n':
                try {
                    args.shares = std::stoull(optarg);
                } catch (const std::exception&) {
                    std::cerr << "[ERROR] Invalid shares count '" << optarg << "'\n";
                    return args;
                }
                break;
            case 'p':
                try {
                    args.price = std::stod(optarg);
                } catch (const std::exception&) {
                    std::cerr << "[ERROR] Invalid price '" << optarg << "'\n";
                    return args;
                }
                break;
            case 'h':
                args.show_help = true;
                return args;
            case '?':
                // getopt_long already printed error message
                return args;
            default:
                return args;
        }
    }
    
    // Validate required arguments
    if (args.config_file.empty() || args.symbol.empty() || 
        args.side == 0 || args.shares == 0 || args.price <= 0.0) {
        std::cerr << "[ERROR] Missing required arguments\n";
        return args;
    }
    
    args.valid = true;
    return args;
}

int main(int argc, char* argv[]) {
    std::cout << "\n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
    std::cout << "                    BEACON TWAP PROTOCOL EXECUTOR                           \n";
    std::cout << "                         Starting Up...                                    \n";
    std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
    
    // Parse command line arguments
    auto args = parseArgs(argc, argv);
    
    if (args.show_help) {
        printUsage(argv[0]);
        return 0;
    }
    
    if (!args.valid) {
        std::cerr << "\nUse --help for usage information\n";
        return 1;
    }
    
    // Install signal handlers
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);
    
    std::cout << "\n[MAIN] Configuration Summary:\n";
    std::cout << "  Config File: " << args.config_file << "\n";
    std::cout << "  Symbol:      " << args.symbol << "\n";
    std::cout << "  Side:        " << (args.side == 'B' ? "BUY" : "SELL") << "\n";
    std::cout << "  Shares:      " << args.shares << "\n";
    std::cout << "  Price:       $" << std::fixed << std::setprecision(2) << args.price << "\n";
    std::cout << "\n";
    
    try {
        // Create TWAP executor
        std::cout << "[MAIN] Creating TWAP executor...\n";
        g_executor = createTwapExecutor(args.config_file);
        
        // Initialize executor
        std::cout << "[MAIN] Initializing executor...\n";
        if (!g_executor->initialize()) {
            std::cerr << "[MAIN ERROR] Failed to initialize TWAP executor\n";
            return 1;
        }
        
        // Convert price to fixed-point (1/10000 dollars)
        uint32_t limit_price = static_cast<uint32_t>(args.price * 10000);
        
        // Start TWAP execution
        std::cout << "[MAIN] Starting TWAP execution...\n";
        if (!g_executor->startExecution(args.symbol, args.side, args.shares, limit_price)) {
            std::cerr << "[MAIN ERROR] Failed to start TWAP execution\n";
            return 1;
        }
        
        // Monitor execution
        std::cout << "[MAIN] Monitoring execution (Ctrl+C to stop)...\n\n";
        
        auto last_stats_time = std::chrono::steady_clock::now();
        
        while (g_running.load()) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            
            // Print stats every 10 seconds
            auto now = std::chrono::steady_clock::now();
            if (now - last_stats_time >= std::chrono::seconds(10)) {
                auto stats = g_executor->getExecutionStats();
                std::cout << "[MAIN] Progress: " << stats.shares_executed << "/" << args.shares 
                          << " shares (" << std::fixed << std::setprecision(1) << (stats.fill_rate * 100) << "%)\n";
                last_stats_time = now;
                
                if (stats.is_complete) {
                    std::cout << "[MAIN] ✓ TWAP execution completed successfully!\n";
                    break;
                }
            }
        }
        
        // Final statistics
        auto final_stats = g_executor->getExecutionStats();
        std::cout << "\n═══════════════════════════════════════════════════════════════════════════\n";
        std::cout << "                          EXECUTION SUMMARY                                \n";
        std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
        std::cout << "  Symbol:           " << args.symbol << "\n";
        std::cout << "  Side:             " << (args.side == 'B' ? "BUY" : "SELL") << "\n";
        std::cout << "  Target Shares:    " << args.shares << "\n";
        std::cout << "  Executed Shares:  " << final_stats.shares_executed << "\n";
        std::cout << "  Fill Rate:        " << std::fixed << std::setprecision(2) << (final_stats.fill_rate * 100) << "%\n";
        std::cout << "  Orders Sent:      " << final_stats.orders_sent << "\n";
        std::cout << "  Status:           " << (final_stats.is_complete ? "COMPLETED" : "PARTIAL") << "\n";
        std::cout << "═══════════════════════════════════════════════════════════════════════════\n";
        
        g_executor->stopExecution();
        
        return final_stats.is_complete ? 0 : 1;
        
    } catch (const std::exception& e) {
        std::cerr << "[MAIN FATAL ERROR] " << e.what() << "\n";
        return 1;
    }
}