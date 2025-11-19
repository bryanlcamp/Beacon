/*
 * =============================================================================
 * Project:      Beacon
 * Application:  client_algorithm
 * File:         TwapProtocolExecutor.h
 * Purpose:      Protocol-aware TWAP algorithm execution engine that sends
 *               orders using correct binary protocol via TCP to matching engine
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <string>
#include <memory>
#include <atomic>
#include <chrono>
#include <nlohmann/json.hpp>
#include <configuration.h>

namespace beacon {
namespace client_algorithm {
namespace twap {

// Forward declarations
struct TwapConfig;
struct MarketDataMessage;
struct ExecutionReport;

/**
 * @brief Protocol-specific order entry structures
 */

// NASDAQ OUCH v5.0 Enter Order Message (64 bytes)
struct __attribute__((packed)) OuchEnterOrderMessage {
    uint64_t clientOrderId;      // 8 bytes: unique client order ID
    char symbol[8];              // 8 bytes: padded stock symbol
    uint32_t shares;             // 4 bytes: number of shares
    uint32_t price;              // 4 bytes: price in 1/10000 dollars
    char side;                   // 1 byte: 'B'=buy, 'S'=sell
    char timeInForce;            // 1 byte: '0'=Day, '3'=IOC, '4'=FOK
    char orderType;              // 1 byte: 'O'=order
    char capacity;               // 1 byte: 'A'=agency, 'P'=principal
    uint16_t reserved;           // 2 bytes: padding/future use
    char _padding[34];           // 34 bytes: padding to 64 bytes
};
static_assert(sizeof(OuchEnterOrderMessage) == 64, "OuchEnterOrderMessage must be 64 bytes");

// NYSE Pillar Gateway Order Entry Message (64 bytes)
struct __attribute__((packed)) PillarOrderEntryMessage {
    uint64_t clientOrderId;      // 8 bytes
    char symbol[8];              // 8 bytes: symbol
    uint32_t quantity;           // 4 bytes
    uint32_t price;              // 4 bytes: price in 1/10000 dollars
    char side;                   // 1 byte: 'B' or 'S'
    char timeInForce;            // 1 byte: '0', '3', '4'
    char orderType;              // 1 byte: 'L'=limit
    char capacity;               // 1 byte: trading capacity
    uint32_t minQuantity;        // 4 bytes: minimum execution size
    char pegType;                // 1 byte: '0'=none, 'M'=mid
    char routingInst[3];         // 3 bytes: routing instructions
    char _padding[28];           // 28 bytes: padding to 64 bytes
};
static_assert(sizeof(PillarOrderEntryMessage) == 64, "PillarOrderEntryMessage must be 64 bytes");

// CME iLink 3 New Order Single Message (64 bytes simplified)
struct __attribute__((packed)) CmeOrderEntryMessage {
    uint64_t clOrdId;            // 8 bytes: client order ID
    char symbol[8];              // 8 bytes: instrument symbol
    uint32_t orderQty;           // 4 bytes: order quantity
    uint32_t price;              // 4 bytes: price (CME price format)
    char side;                   // 1 byte: '1'=buy, '2'=sell
    char ordType;                // 1 byte: '2'=limit, '1'=market
    char timeInForce;            // 1 byte: '0'=Day, '3'=IOC, '4'=FOK
    uint32_t account;            // 4 bytes: account identifier
    uint16_t partyId;            // 2 bytes: party identifier
    char customerOrFirm;         // 1 byte: '0'=customer, '1'=firm
    char _padding[30];           // 30 bytes: padding to 64 bytes
};
static_assert(sizeof(CmeOrderEntryMessage) == 64, "CmeOrderEntryMessage must be 64 bytes");

/**
 * @brief Protocol-aware TWAP execution engine
 */
class TwapProtocolExecutor {
public:
    enum class Protocol {
        OUCH_50,    // NASDAQ OUCH v5.0
        PILLAR_32,  // NYSE Pillar Gateway v3.2  
        CME_ILINK3  // CME iLink 3
    };

private:
    // Configuration
    Protocol protocol_;
    std::string config_file_path_;
    nlohmann::json config_;
    
    // Network settings
    std::string market_data_host_;
    int market_data_port_;
    std::string order_entry_host_;
    int order_entry_port_;
    
    // TWAP parameters
    struct TwapParams {
        uint64_t total_shares;
        int time_window_minutes;
        int slice_count;
        double participation_rate;
        std::string symbol;
        char side;  // 'B' or 'S'
        uint32_t limit_price;  // in 1/10000 dollars
    } twap_params_;
    
    // Execution state
    std::atomic<uint64_t> shares_executed_{0};
    std::atomic<uint64_t> orders_sent_{0};
    std::atomic<bool> running_{false};
    
    // TCP connection for order entry
    int order_socket_ = -1;

public:
    /**
     * @brief Constructor
     * @param config_file Path to protocol-specific configuration file
     */
    explicit TwapProtocolExecutor(const std::string& config_file);
    
    /**
     * @brief Initialize the executor with configuration
     * @return true if initialization successful
     */
    bool initialize();
    
    /**
     * @brief Start TWAP execution
     * @param symbol Stock symbol (e.g., "AAPL")
     * @param side 'B' for buy, 'S' for sell
     * @param total_shares Total shares to execute
     * @param limit_price Limit price in 1/10000 dollars
     * @return true if execution started successfully
     */
    bool startExecution(const std::string& symbol, char side, 
                       uint64_t total_shares, uint32_t limit_price);
    
    /**
     * @brief Stop TWAP execution
     */
    void stopExecution();
    
    /**
     * @brief Get execution statistics
     */
    struct ExecutionStats {
        uint64_t shares_executed;
        uint64_t orders_sent;
        double fill_rate;
        bool is_complete;
    };
    
    ExecutionStats getExecutionStats() const;

private:
    /**
     * @brief Load and parse configuration file
     */
    bool loadConfiguration();
    
    /**
     * @brief Establish TCP connection to matching engine
     */
    bool connectToMatchingEngine();
    
    /**
     * @brief Send protocol-specific order message
     */
    bool sendOrder(uint64_t order_id, uint32_t quantity);
    
    /**
     * @brief Create OUCH order message
     */
    OuchEnterOrderMessage createOuchOrder(uint64_t order_id, uint32_t quantity) const;
    
    /**
     * @brief Create Pillar order message
     */
    PillarOrderEntryMessage createPillarOrder(uint64_t order_id, uint32_t quantity) const;
    
    /**
     * @brief Create CME order message
     */
    CmeOrderEntryMessage createCmeOrder(uint64_t order_id, uint32_t quantity) const;
    
    /**
     * @brief Main TWAP execution loop
     */
    void executionLoop();
    
    /**
     * @brief Calculate next slice size based on TWAP algorithm
     */
    uint32_t calculateSliceSize() const;
    
    /**
     * @brief Convert protocol string to enum
     */
    static Protocol parseProtocol(const std::string& protocol_str);
};

/**
 * @brief Factory function to create protocol-specific TWAP executor
 * @param protocol_config_path Path to configuration file containing protocol settings
 * @return Unique pointer to TwapProtocolExecutor
 */
std::unique_ptr<TwapProtocolExecutor> createTwapExecutor(const std::string& protocol_config_path);

} // namespace twap
} // namespace client_algorithm  
} // namespace beacon