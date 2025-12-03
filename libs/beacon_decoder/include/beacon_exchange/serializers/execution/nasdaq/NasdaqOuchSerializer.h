/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges  
 * Purpose:      NASDAQ OUCH protocol execution data serializer
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "BaseSerializer.h"
#include <fstream>
#include <string>
#include <memory>
#include <cstdint>

namespace beacon::beacon_exchange::serializers {

/**
 * @brief NASDAQ OUCH execution data message structures
 * Based on NASDAQ OUCH 4.2 specification
 */
struct NasdaqOuchMessage : public ExecutionDataMessage {
    char MessageType;           // OUCH message type ('O', 'U', 'X', etc.)
    uint64_t Token;            // Order token
    char BuySellIndicator;     // 'B' or 'S'  
    uint32_t Shares;           // Number of shares
    std::string Stock;         // Stock symbol (8 bytes)
    uint32_t Price;            // Price in 10000ths
    uint32_t TimeInForce;      // Time in force
    std::string Firm;          // Firm identifier (4 bytes)
    char Display;              // Display indicator
    uint64_t Capacity;         // Order capacity
    char IntermarketSweepEligibility;
    uint32_t MinimumQuantity;
    char CrossType;            // Cross type
    
    // Additional OUCH-specific fields
    std::string CustomerType;  // Customer type (4 bytes)
    uint64_t OrderReferenceNumber;
    char LiquidityFlag;        // Liquidity flag
    uint32_t ExecutedShares;
    uint32_t ExecutionPrice;
    uint64_t MatchNumber;
};

/**
 * @brief NASDAQ OUCH execution data serializer
 * Implements NASDAQ OUCH 4.2 protocol for order entry and execution reporting
 */
class NasdaqOuchSerializer : public ISerializeExecutionData, public IDeserializeExecutionData {
private:
    std::ofstream OutputFile;
    std::string OutputPath;
    
    // OUCH protocol constants
    static constexpr size_t OUCH_MESSAGE_SIZE = 40;  // Standard OUCH message size
    static constexpr char MSG_TYPE_ORDER_ENTERED = 'O';
    static constexpr char MSG_TYPE_ORDER_REPLACED = 'U'; 
    static constexpr char MSG_TYPE_ORDER_CANCELED = 'X';
    static constexpr char MSG_TYPE_ORDER_EXECUTED = 'E';
    static constexpr char MSG_TYPE_BROKEN_TRADE = 'B';
    static constexpr char MSG_TYPE_REJECT = 'J';
    
    /**
     * @brief Convert generic execution message to NASDAQ OUCH format
     */
    NasdaqOuchMessage ConvertToOuchMessage(const ExecutionDataMessage& Message);
    
    /**
     * @brief Serialize OUCH message to binary format
     */
    void SerializeOuchMessage(const NasdaqOuchMessage& OuchMsg);
    
    /**
     * @brief Parse binary OUCH data to message structure
     */
    std::unique_ptr<NasdaqOuchMessage> ParseOuchMessage(const char* Data, size_t Size);

public:
    explicit NasdaqOuchSerializer(const std::string& OutputPath);
    virtual ~NasdaqOuchSerializer();
    
    // ISerializeExecutionData interface implementation
    void Serialize(const ExecutionDataMessage& Message) override;
    std::unique_ptr<ExecutionDataMessage> Deserialize(const char* Data, size_t Size) override;
    ExchangeType GetExchangeType() const override;
    void Flush() override;
    
    /**
     * @brief OUCH-specific serialization methods
     */
    void SerializeOrderEntry(const ExecutionDataMessage& Message);
    void SerializeOrderCancel(const ExecutionDataMessage& Message);
    void SerializeOrderReplace(const ExecutionDataMessage& Message);
    
    /**
     * @brief Get OUCH protocol version
     */
    static std::string GetProtocolVersion() { return "OUCH 4.2"; }
};

} // namespace beacon::exchanges::serializers