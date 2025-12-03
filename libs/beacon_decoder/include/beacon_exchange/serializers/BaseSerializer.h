/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      Base interface for all exchange protocol serializers
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "../protocol_common.h"
#include <string>
#include <memory>
#include <cstdint>
#include <vector>
#include <optional>

namespace beacon::beacon_exchange::serializers {

/**
 * @brief Generic market data message structure
 * Common interface for all exchange protocols
 */
struct MarketDataMessage {
    std::string Symbol;
    std::string Type;           // "Buy", "Sell", "Trade", etc.
    double Price;
    uint32_t Quantity;
    uint64_t SequenceNumber;
    uint64_t Timestamp;
    
    // Protocol-specific extensions can inherit from this
};

/**
 * @brief Generic execution/order data message structure
 * Common interface for execution reports, fills, order acknowledgments
 */
struct ExecutionDataMessage {
    std::string OrderId;
    std::string ClientOrderId;
    std::string Symbol;
    std::string Side;           // "Buy", "Sell"
    std::string OrderType;      // "Market", "Limit", "Stop", etc.
    std::string ExecType;       // "New", "PartialFill", "Fill", "Canceled", etc.
    double Price;
    uint32_t Quantity;
    uint32_t FilledQuantity;
    uint32_t RemainingQuantity;
    uint64_t TransactionTime;
    uint64_t SequenceNumber;
    std::string ExchangeOrderId;
    std::string RejectReason;   // If applicable
    
    // Protocol-specific extensions can inherit from this
};

/**
 * @brief Base serializer interface for market data
 * Unified interface that replaces scattered market data serializer implementations
 */
class ISerializeMarketData {
public:
    virtual ~ISerializeMarketData() = default;
    
    /**
     * @brief Serialize a market data message to binary format
     * @param Message The message to serialize
     */
    virtual void Serialize(const MarketDataMessage& Message) = 0;
    
    /**
     * @brief Deserialize binary data to market data message
     * @param Data Binary data buffer
     * @param Size Size of binary data
     * @return Deserialized message, nullptr if invalid
     */
    virtual std::unique_ptr<MarketDataMessage> Deserialize(const char* Data, size_t Size) = 0;
    
    /**
     * @brief Get the exchange type this serializer handles
     */
    virtual ExchangeType GetExchangeType() const = 0;
    
    /**
     * @brief Flush any buffered data
     */
    virtual void Flush() = 0;
};

/**
 * @brief Base serializer interface for execution/order data
 * Unified interface for execution reports, fills, order acknowledgments
 */
class ISerializeExecutionData {
public:
    virtual ~ISerializeExecutionData() = default;
    
    /**
     * @brief Serialize an execution data message to binary format
     * @param Message The execution message to serialize
     */
    virtual void Serialize(const ExecutionDataMessage& Message) = 0;
    
    /**
     * @brief Deserialize binary data to execution data message
     * @param Data Binary data buffer
     * @param Size Size of binary data
     * @return Deserialized message, nullptr if invalid
     */
    virtual std::unique_ptr<ExecutionDataMessage> Deserialize(const char* Data, size_t Size) = 0;
    
    /**
     * @brief Get the exchange type this serializer handles
     */
    virtual ExchangeType GetExchangeType() const = 0;
    
    /**
     * @brief Flush any buffered data
     */
    virtual void Flush() = 0;
};



/**
 * @brief Base deserializer interface for market data (read-only)
 * Used by client applications that only need to parse incoming market data
 */
class IDeserializeMarketData {
public:
    virtual ~IDeserializeMarketData() = default;
    
    /**
     * @brief Deserialize binary data to market data message
     * @param Data Binary data buffer
     * @param Size Size of binary data
     * @return Deserialized message, nullptr if invalid
     */
    virtual std::unique_ptr<MarketDataMessage> Deserialize(const char* Data, size_t Size) = 0;
    
    /**
     * @brief Get the exchange type this deserializer handles
     */
    virtual ExchangeType GetExchangeType() const = 0;
};

/**
 * @brief Base deserializer interface for execution/order data (read-only)
 * Used by client applications that only need to parse incoming execution reports
 */
class IDeserializeExecutionData {
public:
    virtual ~IDeserializeExecutionData() = default;
    
    /**
     * @brief Deserialize binary data to execution data message
     * @param Data Binary data buffer
     * @param Size Size of binary data
     * @return Deserialized message, nullptr if invalid
     */
    virtual std::unique_ptr<ExecutionDataMessage> Deserialize(const char* Data, size_t Size) = 0;
    
    /**
     * @brief Get the exchange type this deserializer handles
     */
    virtual ExchangeType GetExchangeType() const = 0;
};

/**
 * @brief Unified serializer interface that handles both market data and execution data
 * For exchanges that use the same protocol for both types (like FIX)
 */
class ISerializeUnified : public ISerializeMarketData, public ISerializeExecutionData {
public:
    virtual ~ISerializeUnified() = default;
    
    // Inherits both market data and execution data serialization capabilities
};

} // namespace beacon::exchanges::serializers