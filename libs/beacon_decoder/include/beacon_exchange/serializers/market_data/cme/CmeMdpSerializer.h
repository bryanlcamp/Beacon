/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      CME MDP 3.0 protocol serializer  
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "BaseSerializer.h"
#include <fstream>

namespace beacon::exchanges::serializers {

/**
 * @brief CME MDP 3.0 protocol serializer
 * Handles binary serialization/deserialization for CME futures market data
 */
class CmeMdpSerializer : public ISerializeMarketData, public IDeserializeMarketData {
private:
    std::string _outputPath;
    std::ofstream _outputFile;
    uint64_t _messageCount;

public:
    /**
     * @brief Constructor
     * @param outputPath Output file path for binary data
     */
    explicit CmeMdpSerializer(const std::string& outputPath);
    
    ~CmeMdpSerializer() override;

    // IExchangeSerializer implementation
    void Serialize(const MarketDataMessage& Message) override;
    std::unique_ptr<MarketDataMessage> Deserialize(const char* Data, size_t Size) override;
    ExchangeType GetExchangeType() const override { return ExchangeType::CME; }
    void Flush() override;

private:
    /**
     * @brief Serialize as CME Market Data Order message
     */
    void SerializeMarketDataOrder(const MarketDataMessage& Message);
    
    /**
     * @brief Convert price to CME tick format
     */
    int64_t priceToCmeFormat(double price) const;
    
    /**
     * @brief Convert CME tick format back to price
     */
    double cmeFormatToPrice(int64_t cmeTicks) const;
};

} // namespace beacon::exchanges::serializers