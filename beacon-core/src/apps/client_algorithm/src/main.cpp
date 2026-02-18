#include <iostream>
#include <chrono>
#include "../include/ConfigProvider.h"
#include "hft/profiling/latency_tracker.h"
#include "hft/concurrency/pinned_thread.h"

int main(int argc, char* argv[]) {
    std::cout << "Beacon Client Algorithm Starting..." << std::endl;

    // Load configuration
    auto config = beacon::config::ConfigProvider::getInstance();
    if (argc > 1) {
        if (!config->loadConfig(argv[1])) {
            std::cerr << "Failed to load config" << std::endl;
            return 1;
        }
    }

    std::cout << "Algorithm Type: " << config->getAlgorithmType() << std::endl;
    std::cout << "Position Limit: " << config->getPositionLimit() << std::endl;
    std::cout << "Thread Core: " << config->getThreadAffinityCore() << std::endl;

    // TODO: Initialize algorithm
    // TODO: Connect to market data
    // TODO: Start trading loop

    std::cout << "Beacon Client Algorithm Finished." << std::endl;
    return 0;
}
