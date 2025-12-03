/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges  
 * Purpose:      NASDAQ ITCH 5.0 protocol serializer
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "BaseSerializer.h"
#include <fstream>
#include <memory>

namespace beacon::exchanges::serializers {

/**
 * @brief NASDAQ ITCH 5.0 protocol serializer
 * Handles binary serialization/deserialization for NASDAQ market data
 */
class NasdaqItchSerializer : public ISerializeMarketData, public IDeserializeMarketData {
private:
    std::string _OutputPath;
    std::ofstream _OutputFile;
    uint32_t _FlushInterval;
    uint32_t _MessageCount;

public:
    /**
     * @brief Constructor
     * @param outputPath Output file path for binary data
     * @param flushInterval Flush after this many messages (default: 1000)
     */
    explicit NasdaqItchSerializer(
        const std::string& OutputPath, 
        uint32_t FlushInterval = 1000
    );
    
    ~NasdaqItchSerializer() override;

    // IExchangeSerializer implementation
    void Serialize(const MarketDataMessage& Message) override;
    std::unique_ptr<MarketDataMessage> Deserialize(const char* Data, size_t Size) override;
    ExchangeType GetExchangeType() const override { return ExchangeType::NASDAQ; }
    void Flush() override;

private:
    /**
     * @brief Serialize as ITCH AddOrder message
     */
    void SerializeAddOrder(const MarketDataMessage& Message);
    
    /**
     * @brief Serialize as ITCH Trade message
     */
    void SerializeTrade(const MarketDataMessage& Message);
    
    /**
     * @brief Convert price from double to ITCH format (1/10000 dollars)
     */
    uint32_t priceToItchFormat(double price) const;
    
    /**
     * @brief Convert ITCH price format back to double
     */
    double itchFormatToPrice(uint32_t itchPrice) const;
};

} // namespace beacon::exchanges::serializers