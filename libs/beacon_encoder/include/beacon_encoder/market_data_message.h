/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      Lightweight internal market data message format
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <string>

namespace beacon::encoder {

/**
 * @brief Lightweight internal market data message
 * 
 * Cherry-picked essentials from exchange messages:
 * - Symbol identification
 * - Price/quantity data  
 * - Message classification
 * - Minimal timing info
 * 
 * Designed for:
 * - Cache efficiency (64-byte alignment target)
 * - Easy exchange format conversion
 * - HFT performance requirements
 */
struct alignas(64) InternalMarketDataMessage {
    // Core identification (24 bytes)
    char symbol[16];        // Symbol name (null-terminated, space-padded)
    uint64_t timestamp;     // Nanoseconds since epoch or exchange time
    
    // Price/quantity data (16 bytes)
    uint32_t price;         // Price in implied decimal format (4 decimal places)
    uint32_t quantity;      // Share quantity
    uint64_t sequenceNum;   // Sequence number for ordering
    
    // Message classification (4 bytes)
    char messageType;       // 'A'=Add, 'P'=Trade, 'D'=Delete, 'U'=Update
    char side;              // 'B'=Buy, 'S'=Sell, 'T'=Trade, 'U'=Unknown
    uint8_t symbolLength;   // Actual length of symbol (optimization)
    uint8_t flags;          // Reserved for additional flags
    
    // Padding to 64 bytes for cache alignment (16 bytes remaining)
    char _reserved[16];
    
    // Convenience methods
    bool isTrade() const { return messageType == 'P' || messageType == 'T'; }
    bool isOrder() const { return messageType == 'A' || messageType == 'U'; }
    bool isBuy() const { return side == 'B'; }
    bool isSell() const { return side == 'S'; }
    
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

static_assert(sizeof(InternalMarketDataMessage) == 64, 
              "InternalMarketDataMessage must be exactly 64 bytes for cache efficiency");

} // namespace beacon::encoder
