/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Main entry point for the exchange market data generator.
 *               Parses command-line arguments, loads configuration, and
 *               orchestrates message generation with proper error handling.
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <algorithm>
#include <filesystem>
#include <iostream>
#include <string>
#include <getopt.h>

#include <nlohmann/json.hpp>

#include "../include/ConfigProvider.h"
#include "../include/MessageGenerator.h"

namespace beaconconfig = beacon::market_data_generator::config;

const std::string JSON_EXTENSION [[maybe_unused]] = ".json"; // Changed from constexpr std::string_view to std::string
const std::string ILLEGAL_CHARS = "<>:\"|?*"; // Changed from constexpr std::string_view to std::string

std::string toLower(const std::string& inString) {
    std::string lowerString = inString;
    std::transform(lowerString.begin(), lowerString.end(), lowerString.begin(), ::tolower);
    return lowerString;
}

bool isPathWellFormed(const std::string& path) {
    try {
        // Check if the path can be constructed as a std::filesystem::path
        std::filesystem::path fsPath(path);
        if (fsPath.empty()) {
            return false;
        }

        // Check for illegal characters in the path
        for (char ch : ILLEGAL_CHARS) {
            if (path.find(ch) != std::string::npos) {
                std::cerr << "Path contains invalid character: " << ch << "\n";
                return false;
            }
        }

        return true;
    }
    catch (const std::filesystem::filesystem_error& e) {
        std::cerr << "The specified path is invalid: " << e.what() << "\n";
        return false;
    }
}

// Prints professional usage information
void printUsage(const char* programName) {
    std::cout << "Beacon Market Data Generator - Professional Exchange Simulator\n\n";
    std::cout << "USAGE:\n";
    std::cout << "  " << programName << " -i <config> -o <output> [options]\n\n";
    std::cout << "REQUIRED OPTIONS:\n";
    std::cout << "  -i, --input <file>     Configuration file (JSON format)\n";
    std::cout << "  -o, --output <file>    Output file path\n\n";
    std::cout << "OUTPUT OPTIONS:\n";
    std::cout << "  -c, --csv              Generate human-readable CSV output\n";
    std::cout << "                         (default: binary exchange protocol)\n\n";
    std::cout << "GENERAL OPTIONS:\n";
    std::cout << "  -h, --help             Show this help message\n\n";
    std::cout << "EXAMPLES:\n";
    std::cout << "  # Generate binary ITCH data (production mode)\n";
    std::cout << "  " << programName << " -i config.json -o market_data.itch\n\n";
    std::cout << "  # Generate human-readable CSV for analysis\n";
    std::cout << "  " << programName << " -i config.json -o data.csv --csv\n\n";
    std::cout << "  # Short form with CSV output\n";
    std::cout << "  " << programName << " -i config.json -o data.csv -c\n\n";
    std::cout << "SUPPORTED EXCHANGE PROTOCOLS:\n";
    std::cout << "  • NASDAQ ITCH 5.0 (binary)\n";
    std::cout << "  • CME MDP 3.0 (binary)\n";
    std::cout << "  • NYSE Pillar (binary)\n";
    std::cout << "  • CSV (human-readable, all exchanges)\n\n";
}

int main(int argc, char* argv[]) {
    std::string configFilePath;
    std::string outputFilePath;
    bool csvOutput = false;

    // Define long options
    static struct option long_options[] = {
        {"input",  required_argument, 0, 'i'},
        {"output", required_argument, 0, 'o'},
        {"csv",    no_argument,       0, 'c'},
        {"help",   no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    int option_index = 0;
    
    // Parse command line arguments
    while ((opt = getopt_long(argc, argv, "i:o:ch", long_options, &option_index)) != -1) {
        switch (opt) {
            case 'i':
                configFilePath = optarg;
                break;
            case 'o':
                outputFilePath = optarg;
                break;
            case 'c':
                csvOutput = true;
                break;
            case 'h':
                printUsage(argv[0]);
                return 0;
            case '?':
                std::cerr << "\n";
                printUsage(argv[0]);
                return 1;
            default:
                printUsage(argv[0]);
                return 1;
        }
    }

    // Validate required arguments
    if (configFilePath.empty() || outputFilePath.empty()) {
        std::cerr << "[Error] Missing required arguments.\n\n";
        printUsage(argv[0]);
        return 1;
    }

    try {
        // Validate file paths
        if (!isPathWellFormed(configFilePath)) {
            std::cerr << "[Error] Invalid configuration file path: " << configFilePath << "\n";
            return 1;
        }
        if (!isPathWellFormed(outputFilePath)) {
            std::cerr << "[Error] Invalid output file path: " << outputFilePath << "\n";
            return 1;
        }

        // Create the ConfigProvider and load the configuration
        beacon::market_data_generator::config::ConfigProvider configProvider("", outputFilePath);
        if (!configProvider.loadConfig(configFilePath)) {
            std::cerr << "[Error] Configuration loading failed. Please check the configuration file and try again.\n";
            return 1;
        }

        // Display output format information
        if (csvOutput) {
            std::cout << "[Info] Generating human-readable CSV output: " << outputFilePath << "\\n";
        } else {
            std::cout << "[Info] Generating binary exchange protocol data: " << outputFilePath << "\\n";
        }

        // Configure CSV mode if requested
        if (csvOutput) {
            configProvider.setCsvMode(true);
        }
        
        // Create message generator with the configured provider
        beacon::market_data_generator::MessageGenerator generator(configProvider);
        size_t numMessages = generator.getMessageCount();
        
        // Generate messages (CSV or binary based on the serializer configured in ConfigProvider)
        generator.generateMessages(outputFilePath, numMessages, configFilePath);
    }
    catch (const std::exception& e) {
        std::cerr << "[Error] " << e.what() << "\n";
        std::cerr << "Please check your configuration file and ensure all required fields are properly set.\n";
        return 1;
    }

    return 0;
}