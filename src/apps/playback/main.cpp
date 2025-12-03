/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Main entry point for market data playback tool. Loads binary
 *               market data files and replays them with configurable timing,
 *               burst patterns, and chaos testing rules.
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <iostream>
#include <fstream>
#include <atomic>
#include <thread>
#include <chrono>
#include <filesystem>
#include <csignal>
#include <iomanip>
#include <nlohmann/json.hpp>
#include "BinaryInputFileReader.h"
#include "src/replayers/types/UdpReplayer.h"
#include "src/authorities/RulesEngine.h"
#include "src/authorities/RuleFactory.h"
#include "PlaybackState.h"
#include "protocol_common.h"

namespace fs = std::filesystem;

// Market Data Exchange Simulator - Acts as exchange broadcasting via UDP
class MarketDataExchange {
public:
    MarketDataExchange(const std::string& configPath)
        : _state{}, _running{false}, _messagesSent{0} {
        loadConfiguration(configPath);
        setupUdpSender();
        setupRulesEngine();
    }
    
    ~MarketDataExchange() {
        stop();
    }
    
    bool loadBinaryFile(const std::string& filePath) {
        std::cout << "\n═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "                       LOADING BINARY MARKET DATA                         " << std::endl;
        std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
        
        if (!_fileReader.load(filePath)) {
            std::cerr << "[ERROR] Failed to load binary file: " << filePath << std::endl;
            return false;
        }
        
        // Validate messages and detect format based on generator config
        if (!validateAndDetectFormat(filePath)) {
            std::cerr << "[ERROR] Binary file validation failed" << std::endl;
            return false;
        }
        
        std::cout << "[SUCCESS] Loaded " << _fileReader.size() << " messages" << std::endl;
        std::cout << "[INFO] Exchange format: " << _exchangeFormat << std::endl;
        std::cout << "[INFO] Message size: " << BinaryInputFileReader::MESSAGE_SIZE << " bytes" << std::endl;
        
        return true;
    }
    
    void run() {
        if (!_fileReader.isLoaded()) {
            std::cerr << "[ERROR] No binary file loaded. Call loadBinaryFile() first." << std::endl;
            return;
        }
        
        std::cout << "\n═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "                      STARTING EXCHANGE BROADCAST                         " << std::endl;
        std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
        
        _running = true;
        _rulesEngine.notifyPlaybackStart();
        
        // Setup signal handler for graceful shutdown
        std::signal(SIGINT, [](int) {
            std::cout << "\n[INFO] Shutdown signal received..." << std::endl;
        });
        
        auto startTime = std::chrono::high_resolution_clock::now();
        size_t totalMessages = _fileReader.size();
        
        std::cout << "[INFO] Broadcasting " << totalMessages << " messages via UDP" << std::endl;
        std::cout << "[INFO] UDP Multicast: " << _udpSender->address() << ":" << _udpSender->port() << std::endl;
        std::cout << "[INFO] Rules active: " << _rulesEngine.getRuleCount() << std::endl;
        std::cout << "" << std::endl;
        
        // Main broadcast loop - simulate exchange behavior
        for (size_t messageIndex = 0; messageIndex < totalMessages && _running; ++messageIndex) {
            const char* message = _fileReader.getMessage(messageIndex);
            if (!message) continue;
            
            // Update playback state
            // Update playback state for rules evaluation
            _state.setCurrentMessageIndex(messageIndex);
            _state.initialize(totalMessages);
            if (_running) _state.start(); else _state.stop();            // Apply rules engine to determine if/when to send this message
            auto decision = _rulesEngine.evaluate(messageIndex, message, _state);
            
            // Handle rule decisions
            switch (decision.outcome) {
                case playback::rules::Outcome::DROP:
                    continue; // Skip this message entirely
                    
                case playback::rules::Outcome::VETO:
                    std::cout << "[RULES] Message " << messageIndex << " vetoed by rules engine" << std::endl;
                    continue;
                    
                case playback::rules::Outcome::SEND_NOW:
                case playback::rules::Outcome::CONTINUE:
                case playback::rules::Outcome::MODIFIED:
                    // Apply any delays from rules (bursts, jitter, etc.)
                    if (decision.outcome != playback::rules::Outcome::SEND_NOW && 
                        decision.accumulatedDelay.count() > 0) {
                        std::this_thread::sleep_for(decision.accumulatedDelay);
                    }
                    
                    // Send message via UDP (exchange broadcast)
                    if (_udpSender->send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
                        _messagesSent++;
                        
                        // Progress reporting every 1000 messages
                        if (_messagesSent % 1000 == 0) {
                            double progress = (double)messageIndex / totalMessages * 100.0;
                            std::cout << "[PROGRESS] Sent " << _messagesSent << " messages (" 
                                     << std::fixed << std::setprecision(1) << progress << "%)" << std::endl;
                        }
                    } else {
                        std::cerr << "[WARNING] Failed to send message " << messageIndex << std::endl;
                    }
                    break;
            }
        }
        
        _running = false;
        _rulesEngine.notifyPlaybackEnd();
        
        // Final statistics
        auto endTime = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
        
        std::cout << "\n═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "                           EXCHANGE SHUTDOWN                               " << std::endl;
        std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "[SUMMARY] Messages broadcast: " << _messagesSent << " / " << totalMessages << std::endl;
        std::cout << "[SUMMARY] Duration: " << duration.count() << " ms" << std::endl;
        if (duration.count() > 0) {
            double msgsPerSecond = (double)_messagesSent * 1000.0 / duration.count();
            std::cout << "[SUMMARY] Throughput: " << std::fixed << std::setprecision(0) 
                     << msgsPerSecond << " messages/second" << std::endl;
        }
        std::cout << "[INFO] Exchange simulation complete." << std::endl;
    }
    
    void stop() {
        _running = false;
    }
    
    size_t getMessagesSent() const { return _messagesSent; }
    
private:
    BinaryInputFileReader _fileReader;
    std::unique_ptr<playback::replayer::UdpMulticastMessageSender> _udpSender;
    playback::rules::RulesEngine _rulesEngine;
    playback::rules::PlaybackState _state;
    nlohmann::json _config;
    std::string _exchangeFormat;
    std::atomic<bool> _running;
    std::atomic<size_t> _messagesSent;
    
    void loadConfiguration(const std::string& configPath) {
        std::ifstream configFile(configPath);
        if (!configFile) {
            throw std::runtime_error("Cannot open config file: " + configPath);
        }
        
        configFile >> _config;
        std::cout << "[INFO] Loaded playback configuration: " << configPath << std::endl;
    }
    
    void setupUdpSender() {
        // Load UDP sender configuration
        std::string senderConfigPath = "config/playback/" + _config["senderConfig"].get<std::string>();
        std::ifstream senderFile(senderConfigPath);
        if (!senderFile) {
            throw std::runtime_error("Cannot open sender config: " + senderConfigPath);
        }
        
        nlohmann::json senderConfig;
        senderFile >> senderConfig;
        
        // Use loopback address for local testing (no need to specify external UDP)
        std::string address = senderConfig.value("address", "127.0.0.1"); // Default to loopback
        uint16_t port = senderConfig.value("port", 12345);
        uint8_t ttl = senderConfig.value("ttl", 1);
        
        _udpSender = std::make_unique<playback::replayer::UdpMulticastMessageSender>(
            address, port, ttl
        );
        
        std::cout << "[INFO] UDP sender configured: " << address << ":" << port 
                  << " (TTL: " << (int)ttl << ")" << std::endl;
    }
    
    void setupRulesEngine() {
        // Load authority rules from configuration
        if (_config.contains("authorities")) {
            for (const auto& authorityPath : _config["authorities"]) {
                std::string fullPath = "config/playback/" + authorityPath.get<std::string>();
                loadRuleFromConfig(fullPath);
            }
        }
        
        std::cout << "[INFO] Rules engine configured with " << _rulesEngine.getRuleCount() 
                  << " rules" << std::endl;
    }
    
    void loadRuleFromConfig(const std::string& ruleConfigPath) {
        std::cout << "[INFO] Loading rule from: " << ruleConfigPath << std::endl;
        
        // Use RuleFactory to create the rule from configuration
        auto rule = playback::rules::RuleFactory::createFromConfig(ruleConfigPath);
        
        if (rule) {
            std::cout << "[INFO] Successfully created rule from config" << std::endl;
            _rulesEngine.addRule(std::move(rule));
        } else {
            std::cout << "[WARNING] Failed to create rule from: " << ruleConfigPath << std::endl;
        }
    }
    
    bool validateAndDetectFormat(const std::string& filePath) {
        // Try to determine the generator config used to create this file
        // This helps us validate the binary format matches what we expect
        
        // Look for a matching config file or extract format from filename
        fs::path binPath(filePath);
        std::string baseName = binPath.stem().string();
        
        // Try to find corresponding generator config
        std::vector<std::string> possibleConfigs = {
            "config/generator/sample_config.json",
            "config/generator/" + baseName + ".json"
        };
        
        for (const auto& configPath : possibleConfigs) {
            if (fs::exists(configPath)) {
                if (loadGeneratorConfig(configPath)) {
                    std::cout << "[INFO] Detected format from generator config: " << configPath << std::endl;
                    return validateBinaryFormat();
                }
            }
        }
        
        // Default to NSDQ format if no config found
        _exchangeFormat = std::string{beacon::exchanges::ExchangeTypeToString(beacon::exchanges::ExchangeType::NASDAQ)};
        std::cout << "[INFO] No generator config found, defaulting to NSDQ format" << std::endl;
        return validateBinaryFormat();
    }
    
    bool loadGeneratorConfig(const std::string& configPath) {
        try {
            std::ifstream configFile(configPath);
            if (!configFile) return false;
            
            nlohmann::json genConfig;
            configFile >> genConfig;
            
            if (genConfig.contains("Global") && genConfig["Global"].contains("Exchange")) {
                _exchangeFormat = genConfig["Global"]["Exchange"].get<std::string>();
                std::transform(_exchangeFormat.begin(), _exchangeFormat.end(), 
                              _exchangeFormat.begin(), ::tolower);
                return true;
            }
        } catch (const std::exception& e) {
            std::cout << "[WARNING] Error parsing generator config: " << e.what() << std::endl;
        }
        return false;
    }
    
    bool validateBinaryFormat() {
        // Basic validation: check if file size makes sense for the format
        size_t messageCount = _fileReader.size();
        
        if (messageCount == 0) {
            std::cerr << "[ERROR] Binary file contains no messages" << std::endl;
            return false;
        }
        
        // Validate exchange format
        auto exchangeType = beacon::exchanges::StringToExchangeType(_exchangeFormat);
        if (exchangeType == beacon::exchanges::ExchangeType::INVALID) {
            std::cerr << "[ERROR] Unsupported exchange format: " << _exchangeFormat << std::endl;
            return false;
        }
        
        // Basic message validation - check first few messages have reasonable structure
        for (size_t i = 0; i < std::min(messageCount, size_t(5)); ++i) {
            const char* message = _fileReader.getMessage(i);
            if (!message) {
                std::cerr << "[ERROR] Cannot read message " << i << std::endl;
                return false;
            }
            
            // Basic sanity check - message should not be all zeros or all 0xFF
            bool allZeros = true, allOnes = true;
            for (size_t j = 0; j < BinaryInputFileReader::MESSAGE_SIZE; ++j) {
                if (message[j] != 0) allZeros = false;
                if ((unsigned char)message[j] != 0xFF) allOnes = false;
            }
            
            if (allZeros || allOnes) {
                std::cerr << "[ERROR] Message " << i << " appears to be corrupted" << std::endl;
                return false;
            }
        }
        
        std::cout << "[SUCCESS] Binary format validation passed" << std::endl;
        return true;
    }
};



void printUsage(const char* programName) {
    std::cout << "\n═══════════════════════════════════════════════════════════════════════════" << std::endl;
    std::cout << "                    BEACON MARKET DATA EXCHANGE SIMULATOR                  " << std::endl;
    std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
    std::cout << "\nUsage: " << programName << " [options] <binary_file>" << std::endl;
    std::cout << "\nArguments:" << std::endl;
    std::cout << "  <binary_file>        Binary market data file generated by beacon generator" << std::endl;
    std::cout << "\nOptions:" << std::endl;
    std::cout << "  --config <file>      Playback configuration file (default: config/playback/default.json)" << std::endl;
    std::cout << "  --summary            Show periodic statistics during playback" << std::endl;
    std::cout << "  --help, -h           Show this help message" << std::endl;
    std::cout << "\nExamples:" << std::endl;
    std::cout << "  # Playback generator output with default settings" << std::endl;
    std::cout << "  " << programName << " output.bin" << std::endl;
    std::cout << "  " << std::endl;
    std::cout << "  # Use custom playback rules and show statistics" << std::endl;
    std::cout << "  " << programName << " --config config/playback/burst_mode.json --summary output.bin" << std::endl;
    std::cout << "\nNote: This app acts as an exchange simulator, broadcasting market data" << std::endl;
    std::cout << "      via UDP multicast. Other beacon components can receive this data." << std::endl;
    std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
}

int main(int argc, char* argv[]) {
    try {
        std::string inputFile;
        std::string configFile = "config/playback/default.json";
        bool showSummary = false;
        
        // Parse command line arguments
        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];
            
            if (arg == "--config" && i + 1 < argc) {
                configFile = argv[++i];
            } else if (arg == "--summary") {
                showSummary = true;
            } else if (arg == "--help" || arg == "-h") {
                printUsage(argv[0]);
                return 0;
            } else if (arg.front() != '-') {
                if (inputFile.empty()) {
                    inputFile = arg;
                } else {
                    std::cerr << "[ERROR] Multiple input files specified. Only one binary file is supported." << std::endl;
                    printUsage(argv[0]);
                    return 1;
                }
            } else {
                std::cerr << "[ERROR] Unknown option: " << arg << std::endl;
                printUsage(argv[0]);
                return 1;
            }
        }
        
        if (inputFile.empty()) {
            std::cerr << "[ERROR] No binary input file specified." << std::endl;
            printUsage(argv[0]);
            return 1;
        }
        
        if (!fs::exists(inputFile)) {
            std::cerr << "[ERROR] Input file does not exist: " << inputFile << std::endl;
            return 1;
        }
        
        if (!fs::exists(configFile)) {
            std::cerr << "[ERROR] Configuration file does not exist: " << configFile << std::endl;
            return 1;
        }
        
        std::cout << "\n═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "                       BEACON EXCHANGE SIMULATOR                          " << std::endl;
        std::cout << "                        Market Data Playback Engine                       " << std::endl;
        std::cout << "═══════════════════════════════════════════════════════════════════════════" << std::endl;
        std::cout << "[INFO] Binary file: " << inputFile << std::endl;
        std::cout << "[INFO] Configuration: " << configFile << std::endl;
        std::cout << "[INFO] Statistics: " << (showSummary ? "Enabled" : "Disabled") << std::endl;
        
        // Create the market data exchange simulator
        MarketDataExchange exchange(configFile);
        
        // Load the binary market data file
        if (!exchange.loadBinaryFile(inputFile)) {
            std::cerr << "[ERROR] Failed to initialize exchange with binary file." << std::endl;
            return 1;
        }
        
        // Setup statistics thread if requested
        std::atomic<bool> running{true};
        std::thread statsThread;
        
        if (showSummary) {
            statsThread = std::thread([&]() {
                while (running) {
                    std::this_thread::sleep_for(std::chrono::seconds(3));
                    if (running) {
                        std::cout << "[STATS] Messages broadcast: " << exchange.getMessagesSent() << std::endl;
                    }
                }
            });
        }
        
        // Start the exchange simulator (this blocks until complete)
        exchange.run();
        
        // Cleanup
        running = false;
        if (statsThread.joinable()) {
            statsThread.join();
        }
        
        std::cout << "\n[SUCCESS] Exchange simulation completed successfully." << std::endl;
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "\n[FATAL ERROR] " << e.what() << std::endl;
        std::cerr << "[INFO] Exchange simulation terminated." << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "\n[FATAL ERROR] Unknown exception occurred." << std::endl;
        std::cerr << "[INFO] Exchange simulation terminated." << std::endl;
        return 1;
    }
}