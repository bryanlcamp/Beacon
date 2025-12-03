/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      NYSE Pillar protocol serializer
 * Author:       Bryan Camp  
 * =============================================================================
 */

#pragma once

#include "BaseSerializer.h"
#include <fstream>

namespace beacon::beacon_exchange::serializers {

/**
 * @brief NYSE Pillar protocol serializer
 * Handles binary serialization/deserialization for NYSE market data
 */
class NysePillarSerializer : public ISerializeMarketData, public IDeserializeMarketData {
private:
    std::string _outputPath;
    std::ofstream _outputFile;
    uint64_t _messageCount;

public:
    /**
     * @brief Constructor
     * @param outputPath Output file path for binary data
     */
    explicit NysePillarSerializer(const std::string& outputPath);
    
    ~NysePillarSerializer() override;

    // IExchangeSerializer implementation
    void Serialize(const MarketDataMessage& Message) override;
    std::unique_ptr<MarketDataMessage> Deserialize(const char* Data, size_t Size) override;
    ExchangeType GetExchangeType() const override { return ExchangeType::NYSE; }
    void Flush() override;

private:
    /**
     * @brief Serialize as NYSE Add Order message
     */
    void SerializeAddOrder(const MarketDataMessage& Message);
    
    /**
     * @brief Serialize as NYSE Trade message
     */
    void SerializeTrade(const MarketDataMessage& Message);
    
    /**
     * @brief Convert price to NYSE format (cents)
     */
    uint64_t priceToNyseFormat(double price) const;
    
    /**
     * @brief Convert NYSE format back to price
     */
    double nyseFormatToPrice(uint64_t nyseCents) const;
};

} // namespace beacon::exchanges::serializers