/*
 * =============================================================================
 * Project:      Beacon  
 * Application:  generator
 * Purpose:      Unified serializer using beacon_encoder library for
 *               sub-microsecond market data encoding performance.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <fstream>
#include <memory>
#include <string>
#include <stdexcept>

// Use your ELITE encoder library! 🚀
#include <beacon_encoder/encoder_concepts.h>
#include <beacon_encoder/market_data_message.h>
#include <beacon_encoder/nasdaq/market_data_encoder.h>
#include <beacon_encoder/cme/market_data_encoder.h>
#include <beacon_encoder/nyse/market_data_encoder.h>
#include <beacon_exchange/protocol_common.h>

namespace beacon::generator {

// Keep generator's original message format - DON'T CHANGE GENERATOR LOGIC
struct GeneratorMessage {
    std::string symbol;
    std::string type;        // "Buy", "Sell", "Trade"
    double price;
    int quantity;
    uint64_t sequenceNumber;
    uint64_t timestamp;
    
    bool isTrade() const { return type == "Trade"; }
    bool isBuy() const { return type == "Buy"; }
};

/**
 * @brief Bridge between generator's Message and your encoder library
 * Preserves all existing generator logic while using ELITE encoder
 */
class MessageAdapter {
public:
    /**
     * @brief Convert generator message to your encoder's internal format
     * ZERO changes needed to generator logic!
     */
    static beacon::encoder::InternalMarketDataMessage toEncoderMessage(
        const GeneratorMessage& generatorMsg
    ) {
        beacon::encoder::InternalMarketDataMessage encoderMsg{};
        
        // Bridge the formats - preserve all generator semantics
        encoderMsg.setSymbol(generatorMsg.symbol);
        encoderMsg.setPriceFromDouble(generatorMsg.price);
        encoderMsg.quantity = static_cast<uint32_t>(generatorMsg.quantity);
        encoderMsg.sequenceNum = generatorMsg.sequenceNumber;
        encoderMsg.timestamp = generatorMsg.timestamp;
        
        // Map generator types to encoder types
        if (generatorMsg.isTrade()) {
            encoderMsg.messageType = 'P';  // Trade
        } else {
            encoderMsg.messageType = 'A';  // Add order
        }
        
        encoderMsg.side = generatorMsg.isBuy() ? 'B' : 'S';
        
        return encoderMsg;
    }
};

/**
 * @brief Unified serializer using your MONSTER encoder library 🚀
 * NO CHANGES to generator app logic required!
 */
class UnifiedMarketDataSerializer {
private:
    std::string _exchangeType;
    std::string _outputPath;
    
    // Your encoder library variants (compile-time selection)
    std::unique_ptr<beacon::encoder::nasdaq::MarketDataEncoder> _nasdaqEncoder;
    std::unique_ptr<beacon::encoder::cme::MarketDataEncoder> _cmeEncoder;
    std::unique_ptr<beacon::encoder::nyse::MarketDataEncoder> _nyseEncoder;
    
public:
    explicit UnifiedMarketDataSerializer(const std::string& exchangeType, const std::string& outputPath) 
        : _exchangeType(exchangeType), _outputPath(outputPath) {
        
        // Create the appropriate encoder using your ELITE library
        if (exchangeType == "nasdaq") {
            _nasdaqEncoder = std::make_unique<beacon::encoder::nasdaq::MarketDataEncoder>(outputPath);
        } else if (exchangeType == "cme") {
            _cmeEncoder = std::make_unique<beacon::encoder::cme::MarketDataEncoder>(outputPath);
        } else if (exchangeType == "nyse") {
            _nyseEncoder = std::make_unique<beacon::encoder::nyse::MarketDataEncoder>(outputPath);
        } else {
            throw std::runtime_error("Unsupported exchange: " + exchangeType);
        }
    }
    
    /**
     * @brief Serialize using your MONSTER encoder library
     * Generator app calls this exactly like before - NO CHANGES!
     */
    void serializeMessage(const GeneratorMessage& message) {
        // Convert to your encoder format
        auto encoderMessage = MessageAdapter::toEncoderMessage(message);
        
        // Use your SUB-MICROSECOND encoder! 🚀
        if (_nasdaqEncoder) {
            _nasdaqEncoder->writeToFile(encoderMessage);
        } else if (_cmeEncoder) {
            _cmeEncoder->writeToFile(encoderMessage);
        } else if (_nyseEncoder) {
            _nyseEncoder->writeToFile(encoderMessage);
        }
    }
    
    void flush() {
        if (_nasdaqEncoder) _nasdaqEncoder->flush();
        if (_cmeEncoder) _cmeEncoder->flush();
        if (_nyseEncoder) _nyseEncoder->flush();
    }
    
    bool isReady() const {
        return _nasdaqEncoder || _cmeEncoder || _nyseEncoder;
    }
};

} // namespace beacon::generator