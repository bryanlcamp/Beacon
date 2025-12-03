/*
 * =============================================================================
 * Project:      Beacon
 * Library:      exchanges
 * Purpose:      Serializer factory implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/SerializerFactory.h>
#include <serializers/NasdaqItchSerializer.h>
#include <serializers/CmeMdpSerializer.h>
#include <serializers/NysePillarSerializer.h>
#include <serializers/NasdaqOuchSerializer.h>
#include <serializers/CmeILinkSerializer.h>

namespace beacon::exchanges::serializers {

std::unique_ptr<ISerializeMarketData> SerializerFactory::Create(
    ExchangeType Exchange, 
    const std::string& OutputPath
) {
    switch (Exchange) {
        case ExchangeType::NASDAQ:
            return std::make_unique<NasdaqItchSerializer>(OutputPath);
            
        case ExchangeType::CME:
            return std::make_unique<CmeMdpSerializer>(OutputPath);
            
        case ExchangeType::NYSE:
            return std::make_unique<NysePillarSerializer>(OutputPath);
            
        case ExchangeType::INVALID:
        default:
            return nullptr;
    }
}

std::unique_ptr<ISerializeMarketData> SerializerFactory::Create(
    const std::string& ExchangeStr,
    const std::string& OutputPath
) {
    ExchangeType Exchange = StringToExchangeType(ExchangeStr);
    return Create(Exchange, OutputPath);
}

std::unique_ptr<ISerializeExecutionData> SerializerFactory::CreateExecutionSerializer(
    ExchangeType Exchange,
    const std::string& OutputPath
) {
    switch (Exchange) {
        case ExchangeType::NASDAQ:
            return std::make_unique<NasdaqOuchSerializer>(OutputPath);
            
        case ExchangeType::CME:
            return std::make_unique<CmeILinkSerializer>(OutputPath);
            
        case ExchangeType::NYSE:
            // NYSE Pillar handles both market data and execution data
            // For now return nullptr - would need to extend NysePillarSerializer
            return nullptr;
            
        case ExchangeType::INVALID:
        default:
            return nullptr;
    }
}

std::unique_ptr<ISerializeExecutionData> SerializerFactory::CreateExecutionSerializer(
    const std::string& ExchangeStr,
    const std::string& OutputPath
) {
    ExchangeType Exchange = StringToExchangeType(ExchangeStr);
    return CreateExecutionSerializer(Exchange, OutputPath);
}

std::unique_ptr<ISerializeUnified> SerializerFactory::CreateUnifiedSerializer(
    ExchangeType Exchange,
    const std::string& OutputPath
) {
    // For now, only NYSE Pillar could be unified (handles both market and execution)
    // This would require extending NysePillarSerializer to implement ISerializeUnified
    // Return nullptr for now
    return nullptr;
}

std::unique_ptr<IDeserializeMarketData> SerializerFactory::CreateMarketDataDeserializer(
    ExchangeType Exchange
) {
    // Market data deserializers don't need output paths since they're read-only
    switch (Exchange) {
        case ExchangeType::NASDAQ:
            return std::make_unique<NasdaqItchSerializer>("");  // Empty path for deserialize-only
        case ExchangeType::CME:
            return std::make_unique<CmeMdpSerializer>("");      // Empty path for deserialize-only
        case ExchangeType::NYSE:
            return std::make_unique<NysePillarSerializer>("");  // Empty path for deserialize-only
        case ExchangeType::INVALID:
        default:
            return nullptr;
    }
}

std::unique_ptr<IDeserializeMarketData> SerializerFactory::CreateMarketDataDeserializer(
    const std::string& ExchangeStr
) {
    ExchangeType Exchange = StringToExchangeType(ExchangeStr);
    return CreateMarketDataDeserializer(Exchange);
}

std::unique_ptr<IDeserializeExecutionData> SerializerFactory::CreateExecutionDataDeserializer(
    ExchangeType Exchange
) {
    // Execution data deserializers don't need output paths since they're read-only
    switch (Exchange) {
        case ExchangeType::NASDAQ:
            return std::make_unique<NasdaqOuchSerializer>("");  // Empty path for deserialize-only
        case ExchangeType::CME:
            return std::make_unique<CmeILinkSerializer>("");    // Empty path for deserialize-only
        case ExchangeType::NYSE:
            // NYSE Pillar handles both market data and execution data
            // For now return nullptr - would need execution-specific deserializer
            return nullptr;
        case ExchangeType::INVALID:
        default:
            return nullptr;
    }
}

std::unique_ptr<IDeserializeExecutionData> SerializerFactory::CreateExecutionDataDeserializer(
    const std::string& ExchangeStr
) {
    ExchangeType Exchange = StringToExchangeType(ExchangeStr);
    return CreateExecutionDataDeserializer(Exchange);
}

} // namespace beacon::exchanges::serializers