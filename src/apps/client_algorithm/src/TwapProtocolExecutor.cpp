/*
 * =============================================================================
 * Project:      Beacon
 * Application:  client_algorithm
 * File:         TwapProtocolExecutor.cpp
 * Purpose:      Implementation of protocol-aware TWAP executor
 * Author:       Bryan Camp
 * =============================================================================
 */

#include "TwapProtocolExecutor.h"
#include <iostream>
#include <fstream>
#include <thread>
#include <chrono>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <errno.h>

namespace beacon {
namespace client_algorithm {
namespace twap {

TwapProtocolExecutor::TwapProtocolExecutor(const std::string& config_file)
    : config_file_path_(config_file) {
}

bool TwapProtocolExecutor::initialize() {
    std::cout << "[TWAP] Initializing protocol executor...\n";
    
    // Load configuration
    if (!loadConfiguration()) {
        std::cerr << "[TWAP ERROR] Failed to load configuration\n";
        return false;
    }
    
    std::cout << "[TWAP] ✓ Configuration loaded\n";
    std::cout << "[TWAP] Protocol: " << static_cast<int>(protocol_) << "\n";
    std::cout << "[TWAP] Market Data: " << market_data_host_ << ":" << market_data_port_ << "\n";
    std::cout << "[TWAP] Order Entry: " << order_entry_host_ << ":" << order_entry_port_ << "\n";
    
    return true;
}

bool TwapProtocolExecutor::loadConfiguration() {
    try {
        // Use common configuration utility
        config_ = beacon::common::configuration::ConfigurationPaths::loadConfiguration(config_file_path_);
        
        // Extract networking configuration
        if (config_.contains("networking")) {
            auto& networking = config_["networking"];
            
            if (networking.contains("market_data")) {
                market_data_host_ = networking["market_data"]["host"];
                market_data_port_ = networking["market_data"]["port"];
            }
            
            if (networking.contains("order_entry")) {
                order_entry_host_ = networking["order_entry"]["host"];
                order_entry_port_ = networking["order_entry"]["port"];
            }
        }
        
        // Extract protocol configuration
        if (config_.contains("protocol_config")) {
            auto& protocol_config = config_["protocol_config"];
            std::string order_protocol = protocol_config["order_entry_protocol"];
            protocol_ = parseProtocol(order_protocol);
        }
        
        // Extract TWAP algorithm parameters
        if (config_.contains("twap_algorithm")) {
            auto& twap_config = config_["twap_algorithm"];
            twap_params_.time_window_minutes = twap_config.value("time_window_minutes", 60);
            twap_params_.slice_count = twap_config.value("slice_count", 20);
            twap_params_.participation_rate = twap_config.value("participation_rate", 0.15);
        }
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[TWAP ERROR] Configuration parsing failed: " << e.what() << "\n";
        return false;
    }
}

bool TwapProtocolExecutor::connectToMatchingEngine() {
    std::cout << "[TWAP] Connecting to matching engine " << order_entry_host_ << ":" << order_entry_port_ << "...\n";
    
    // Create TCP socket
    order_socket_ = socket(AF_INET, SOCK_STREAM, 0);
    if (order_socket_ < 0) {
        std::cerr << "[TWAP ERROR] Failed to create socket: " << strerror(errno) << "\n";
        return false;
    }
    
    // Setup server address
    struct sockaddr_in server_addr;
    std::memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(order_entry_port_);
    
    if (inet_pton(AF_INET, order_entry_host_.c_str(), &server_addr.sin_addr) <= 0) {
        std::cerr << "[TWAP ERROR] Invalid address: " << order_entry_host_ << "\n";
        close(order_socket_);
        return false;
    }
    
    // Connect to matching engine
    if (connect(order_socket_, reinterpret_cast<struct sockaddr*>(&server_addr), sizeof(server_addr)) < 0) {
        std::cerr << "[TWAP ERROR] Connection failed: " << strerror(errno) << "\n";
        close(order_socket_);
        return false;
    }
    
    std::cout << "[TWAP] ✓ Connected to matching engine\n";
    return true;
}

bool TwapProtocolExecutor::startExecution(const std::string& symbol, char side, 
                                         uint64_t total_shares, uint32_t limit_price) {
    
    std::cout << "\n[TWAP] ═══════════════════════════════════════════════════════════\n";
    std::cout << "[TWAP]           STARTING TWAP EXECUTION\n";
    std::cout << "[TWAP] ═══════════════════════════════════════════════════════════\n";
    std::cout << "[TWAP] Symbol: " << symbol << "\n";
    std::cout << "[TWAP] Side: " << (side == 'B' ? "BUY" : "SELL") << "\n";
    std::cout << "[TWAP] Total Shares: " << total_shares << "\n";
    std::cout << "[TWAP] Limit Price: $" << (limit_price / 10000.0) << "\n";
    std::cout << "[TWAP] Time Window: " << twap_params_.time_window_minutes << " minutes\n";
    std::cout << "[TWAP] Slices: " << twap_params_.slice_count << "\n";
    std::cout << "[TWAP] ═══════════════════════════════════════════════════════════\n\n";
    
    // Store execution parameters
    twap_params_.symbol = symbol;
    twap_params_.side = side;
    twap_params_.total_shares = total_shares;
    twap_params_.limit_price = limit_price;
    
    // Connect to matching engine
    if (!connectToMatchingEngine()) {
        return false;
    }
    
    // Start execution
    running_.store(true);
    shares_executed_.store(0);
    orders_sent_.store(0);
    
    // Start execution loop in separate thread
    std::thread execution_thread(&TwapProtocolExecutor::executionLoop, this);
    execution_thread.detach();
    
    return true;
}

void TwapProtocolExecutor::executionLoop() {
    const auto slice_interval = std::chrono::minutes(twap_params_.time_window_minutes) / twap_params_.slice_count;
    const uint32_t shares_per_slice = twap_params_.total_shares / twap_params_.slice_count;
    
    std::cout << "[TWAP] Starting execution loop - " << shares_per_slice << " shares per slice\n";
    std::cout << "[TWAP] Slice interval: " << std::chrono::duration_cast<std::chrono::seconds>(slice_interval).count() << " seconds\n\n";
    
    for (int slice = 0; slice < twap_params_.slice_count && running_.load(); ++slice) {
        auto slice_start = std::chrono::steady_clock::now();
        
        // Calculate remaining shares
        uint64_t executed = shares_executed_.load();
        uint64_t remaining = twap_params_.total_shares - executed;
        
        if (remaining == 0) {
            std::cout << "[TWAP] ✓ All shares executed, stopping early\n";
            break;
        }
        
        // Calculate slice size (use remaining shares if less than standard slice)
        uint32_t slice_size = std::min(shares_per_slice, static_cast<uint32_t>(remaining));
        
        // Generate unique order ID
        uint64_t order_id = (std::chrono::steady_clock::now().time_since_epoch().count() & 0xFFFFFFFF) | 
                           (static_cast<uint64_t>(slice) << 32);
        
        std::cout << "[TWAP] Slice " << (slice + 1) << "/" << twap_params_.slice_count 
                  << " - Sending order for " << slice_size << " shares (Order ID: " << order_id << ")\n";
        
        // Send protocol-specific order
        if (sendOrder(order_id, slice_size)) {
            orders_sent_.fetch_add(1);
            // For simulation, assume immediate fill
            shares_executed_.fetch_add(slice_size);
            std::cout << "[TWAP] ✓ Order sent successfully - Total executed: " << shares_executed_.load() << "/" << twap_params_.total_shares << "\n";
        } else {
            std::cout << "[TWAP] ✗ Order failed\n";
        }
        
        // Wait for next slice interval
        if (slice < twap_params_.slice_count - 1) {  // Don't wait after last slice
            auto elapsed = std::chrono::steady_clock::now() - slice_start;
            auto remaining_time = slice_interval - elapsed;
            
            if (remaining_time > std::chrono::milliseconds(0)) {
                std::cout << "[TWAP] Waiting " << std::chrono::duration_cast<std::chrono::seconds>(remaining_time).count() 
                          << "s for next slice...\n\n";
                std::this_thread::sleep_for(remaining_time);
            }
        }
    }
    
    // Close connection
    if (order_socket_ >= 0) {
        close(order_socket_);
        order_socket_ = -1;
    }
    
    running_.store(false);
    
    std::cout << "\n[TWAP] ═══════════════════════════════════════════════════════════\n";
    std::cout << "[TWAP]           TWAP EXECUTION COMPLETE\n";
    std::cout << "[TWAP] ═══════════════════════════════════════════════════════════\n";
    std::cout << "[TWAP] Total Orders Sent: " << orders_sent_.load() << "\n";
    std::cout << "[TWAP] Total Shares Executed: " << shares_executed_.load() << "/" << twap_params_.total_shares << "\n";
    std::cout << "[TWAP] Fill Rate: " << (100.0 * shares_executed_.load() / twap_params_.total_shares) << "%\n";
    std::cout << "[TWAP] ═══════════════════════════════════════════════════════════\n";
}

bool TwapProtocolExecutor::sendOrder(uint64_t order_id, uint32_t quantity) {
    bool success = false;
    
    switch (protocol_) {
        case Protocol::OUCH_50: {
            auto order_msg = createOuchOrder(order_id, quantity);
            ssize_t sent = send(order_socket_, &order_msg, sizeof(order_msg), 0);
            success = (sent == sizeof(order_msg));
            if (success) {
                std::cout << "[TWAP] → Sent OUCH v5.0 order (" << sizeof(order_msg) << " bytes)\n";
            }
            break;
        }
        
        case Protocol::PILLAR_32: {
            auto order_msg = createPillarOrder(order_id, quantity);
            ssize_t sent = send(order_socket_, &order_msg, sizeof(order_msg), 0);
            success = (sent == sizeof(order_msg));
            if (success) {
                std::cout << "[TWAP] → Sent Pillar v3.2 order (" << sizeof(order_msg) << " bytes)\n";
            }
            break;
        }
        
        case Protocol::CME_ILINK3: {
            auto order_msg = createCmeOrder(order_id, quantity);
            ssize_t sent = send(order_socket_, &order_msg, sizeof(order_msg), 0);
            success = (sent == sizeof(order_msg));
            if (success) {
                std::cout << "[TWAP] → Sent CME iLink 3 order (" << sizeof(order_msg) << " bytes)\n";
            }
            break;
        }
    }
    
    if (!success) {
        std::cerr << "[TWAP ERROR] Failed to send order: " << strerror(errno) << "\n";
    }
    
    return success;
}

OuchEnterOrderMessage TwapProtocolExecutor::createOuchOrder(uint64_t order_id, uint32_t quantity) const {
    OuchEnterOrderMessage order{};
    
    order.clientOrderId = order_id;
    std::strncpy(order.symbol, twap_params_.symbol.c_str(), 8);
    // Pad with spaces
    for (size_t i = twap_params_.symbol.length(); i < 8; ++i) {
        order.symbol[i] = ' ';
    }
    
    order.shares = quantity;
    order.price = twap_params_.limit_price;
    order.side = twap_params_.side;
    order.timeInForce = '0';  // Day order
    order.orderType = 'O';    // OUCH order type
    order.capacity = 'A';     // Agency
    order.reserved = 0;
    
    return order;
}

PillarOrderEntryMessage TwapProtocolExecutor::createPillarOrder(uint64_t order_id, uint32_t quantity) const {
    PillarOrderEntryMessage order{};
    
    order.clientOrderId = order_id;
    std::strncpy(order.symbol, twap_params_.symbol.c_str(), 8);
    // Pad with spaces
    for (size_t i = twap_params_.symbol.length(); i < 8; ++i) {
        order.symbol[i] = ' ';
    }
    
    order.quantity = quantity;
    order.price = twap_params_.limit_price;
    order.side = twap_params_.side;
    order.timeInForce = '0';  // Day order
    order.orderType = 'L';    // Limit order
    order.capacity = 'A';     // Agency
    order.minQuantity = 0;
    order.pegType = '0';      // No peg
    std::strncpy(order.routingInst, "   ", 3);  // No routing
    
    return order;
}

CmeOrderEntryMessage TwapProtocolExecutor::createCmeOrder(uint64_t order_id, uint32_t quantity) const {
    CmeOrderEntryMessage order{};
    
    order.clOrdId = order_id;
    std::strncpy(order.symbol, twap_params_.symbol.c_str(), 8);
    // Pad with spaces
    for (size_t i = twap_params_.symbol.length(); i < 8; ++i) {
        order.symbol[i] = ' ';
    }
    
    order.orderQty = quantity;
    order.price = twap_params_.limit_price;
    order.side = (twap_params_.side == 'B') ? '1' : '2';  // CME uses '1'/'2'
    order.ordType = '2';       // Limit order
    order.timeInForce = '0';   // Day order
    order.account = 12345;     // Example account
    order.partyId = 1;         // Example party ID
    order.customerOrFirm = '0'; // Customer
    
    return order;
}

TwapProtocolExecutor::Protocol TwapProtocolExecutor::parseProtocol(const std::string& protocol_str) {
    if (protocol_str == "ouch_50") {
        return Protocol::OUCH_50;
    } else if (protocol_str == "pillar_oe") {
        return Protocol::PILLAR_32;
    } else if (protocol_str == "cme_ilink3") {
        return Protocol::CME_ILINK3;
    } else {
        std::cerr << "[TWAP WARNING] Unknown protocol '" << protocol_str << "', defaulting to OUCH v5.0\n";
        return Protocol::OUCH_50;
    }
}

void TwapProtocolExecutor::stopExecution() {
    running_.store(false);
}

TwapProtocolExecutor::ExecutionStats TwapProtocolExecutor::getExecutionStats() const {
    ExecutionStats stats;
    stats.shares_executed = shares_executed_.load();
    stats.orders_sent = orders_sent_.load();
    stats.fill_rate = twap_params_.total_shares > 0 ? 
        (static_cast<double>(stats.shares_executed) / twap_params_.total_shares) : 0.0;
    stats.is_complete = (stats.shares_executed >= twap_params_.total_shares);
    return stats;
}

std::unique_ptr<TwapProtocolExecutor> createTwapExecutor(const std::string& protocol_config_path) {
    return std::make_unique<TwapProtocolExecutor>(protocol_config_path);
}

} // namespace twap
} // namespace client_algorithm
} // namespace beacon