/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      Lightweight internal execution message format
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <string>
#include <cstring>

namespace beacon::encoder {

/**
 * @brief Lightweight internal execution message
 * 
 * Cherry-picked essentials for order management:
 * - Order identification
 * - Price/quantity data  
 * - Order lifecycle management
 * - Minimal timing info
 * 
 * Designed for:
 * - Cache efficiency (64-byte alignment target)
 * - Easy exchange format conversion
 * - HFT performance requirements
 */
struct alignas(64) InternalExecutionMessage {
    // Core identification (24 bytes)
    char symbol[16];        // Symbol name (null-terminated, space-padded)
    uint64_t timestamp;     // Nanoseconds since epoch or exchange time
    
    // Order data (24 bytes)
    uint64_t orderToken;    // Internal order reference/token
    uint32_t price;         // Price in implied decimal format (4 decimal places)
    uint32_t quantity;      // Share quantity
    uint64_t clOrdId;       // Client order ID
    
    // Message classification (8 bytes)
    char messageType;       // 'N'=New, 'U'=Modify, 'X'=Cancel, 'R'=Replace
    char side;              // 'B'=Buy, 'S'=Sell
    char orderType;         // 'M'=Market, 'L'=Limit, 'S'=Stop
    char timeInForce;       // 'D'=Day, 'G'=GTD, 'I'=IOC, 'F'=FOK
    uint8_t symbolLength;   // Actual length of symbol (optimization)
    uint8_t flags;          // Reserved for additional flags
    uint16_t _padding1;     // Alignment padding
    
    // Padding to 64 bytes for cache alignment (8 bytes remaining)
    char _reserved[8];
    
    // Convenience methods
    bool isNewOrder() const { return messageType == 'N'; }
    bool isModify() const { return messageType == 'U'; }
    bool isCancel() const { return messageType == 'X'; }
    bool isReplace() const { return messageType == 'R'; }
    
    bool isBuy() const { return side == 'B'; }
    bool isSell() const { return side == 'S'; }
    
    bool isMarketOrder() const { return orderType == 'M'; }
    bool isLimitOrder() const { return orderType == 'L'; }
    
    // Price conversion utilities
    double getPriceAsDouble() const { return static_cast<double>(price) / 10000.0; }
    void setPriceFromDouble(double p) { price = static_cast<uint32_t>(p * 10000.0); }
    
    // Symbol utilities
    std::string getSymbolAsString() const { 
        return std::string(symbol, symbolLength); 
    }
    
    void setSymbol(const std::string& sym) {
        symbolLength = static_cast<uint8_t>(std::min(sym.length(), sizeof(symbol) - 1));
        std::memset(symbol, ' ', sizeof(symbol));
        std::memcpy(symbol, sym.c_str(), symbolLength);
        symbol[sizeof(symbol) - 1] = '\0';
    }
};

static_assert(sizeof(InternalExecutionMessage) == 64, 
              "InternalExecutionMessage must be exactly 64 bytes for cache efficiency");

} // namespace beacon::encoder
