/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges  
 * Purpose:      CME iLink protocol execution data serializer
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
 * @brief CME Order Entry Message structure (from documentation)
 * Based on CME iLink 3 protocol - uses existing documented structure
 */
struct alignas(64) CmeOrderEntryMessage {
    uint64_t clientOrderId;      // 8 bytes: unique client order ID
    char symbol[8];              // 8 bytes: padded instrument symbol
    uint32_t quantity;           // 4 bytes: order quantity
    uint32_t price;              // 4 bytes: price in 1/10000 dollars
    char side;                   // 1 byte: 'B'=buy, 'S'=sell
    char orderType;              // 1 byte: e.g., 'L'=limit, 'M'=market
    char tif;                    // 1 byte: time in force
    char reserved1;              // 1 byte: reserved/future use
    uint16_t reserved2;          // 2 bytes: padding/future use
    char _padding[34];           // 64 - (8+8+4+4+1+1+1+1+2) = 34 bytes
};

static_assert(sizeof(CmeOrderEntryMessage) == 64, "CmeOrderEntryMessage must be 64 bytes");

/**
 * @brief CME execution report message structure
 * Based on iLink 3 execution reporting
 */
struct CmeExecutionReport {
    uint64_t orderID;            // Order ID from exchange
    uint64_t clientOrderId;      // Original client order ID
    char execType;               // Execution type: 'F'=Fill, 'C'=Cancel, 'R'=Replace
    uint32_t executedQty;        // Executed quantity
    uint32_t executionPrice;     // Execution price
    uint32_t leavesQty;          // Remaining quantity
    uint64_t transactTime;       // Transaction time
    char symbol[8];              // Futures symbol
    char side;                   // Side: 'B'=buy, 'S'=sell
    uint64_t matchNumber;        // Match number
    char rejectReason[16];       // Reject reason (if applicable)
    char _padding[10];           // Padding to 80 bytes
};

static_assert(sizeof(CmeExecutionReport) == 96, "CmeExecutionReport must be 96 bytes");

/**
 * @brief CME iLink execution data serializer
 * Implements CME iLink 3 protocol for order entry and execution reporting
 */
class CmeILinkSerializer : public ISerializeExecutionData, public IDeserializeExecutionData {
private:
    std::ofstream OutputFile;
    std::string OutputPath;
    uint32_t MessageCount;
    
    // iLink protocol constants
    static constexpr size_t CME_ORDER_MESSAGE_SIZE = 64;
    static constexpr size_t CME_EXEC_MESSAGE_SIZE = 64;
    
    // Message types
    static constexpr char MSG_TYPE_NEW_ORDER = 'N';
    static constexpr char MSG_TYPE_CANCEL = 'C';
    static constexpr char MSG_TYPE_REPLACE = 'R';
    static constexpr char EXEC_TYPE_FILL = 'F';
    static constexpr char EXEC_TYPE_PARTIAL = 'P';
    static constexpr char EXEC_TYPE_CANCEL = 'C';
    static constexpr char EXEC_TYPE_REPLACE = 'R';
    static constexpr char EXEC_TYPE_REJECT = 'J';
    
    /**
     * @brief Convert generic execution message to CME format
     */
    CmeOrderEntryMessage ConvertToOrderEntry(const ExecutionDataMessage& Message);
    CmeExecutionReport ConvertToExecutionReport(const ExecutionDataMessage& Message);
    
    /**
     * @brief Serialize CME messages to binary format
     */
    void SerializeCmeOrderEntry(const CmeOrderEntryMessage& OrderMsg);
    void SerializeCmeExecutionReport(const CmeExecutionReport& ExecMsg);
    
    /**
     * @brief Parse binary CME data to message structures
     */
    std::unique_ptr<CmeOrderEntryMessage> ParseOrderEntryMessage(const char* Data, size_t Size);
    std::unique_ptr<CmeExecutionReport> ParseExecutionReport(const char* Data, size_t Size);
    
    /**
     * @brief Price conversion utilities
     */
    uint32_t priceToCmeFormat(double price) const;
    double cmeFormatToPrice(uint32_t cmePrice) const;

public:
    explicit CmeILinkSerializer(const std::string& OutputPath);
    virtual ~CmeILinkSerializer();
    
    // ISerializeExecutionData interface implementation
    void Serialize(const ExecutionDataMessage& Message) override;
    std::unique_ptr<ExecutionDataMessage> Deserialize(const char* Data, size_t Size) override;
    ExchangeType GetExchangeType() const override;
    void Flush() override;
    
    /**
     * @brief CME iLink specific serialization methods
     */
    void SerializeNewOrder(const ExecutionDataMessage& Message);
    void SerializeOrderCancel(const ExecutionDataMessage& Message);
    void SerializeOrderReplace(const ExecutionDataMessage& Message);
    void SerializeExecutionReport(const ExecutionDataMessage& Message);
    
    /**
     * @brief Get iLink protocol version
     */
    static std::string GetProtocolVersion() { return "iLink 3"; }
};

} // namespace beacon::exchanges::serializers