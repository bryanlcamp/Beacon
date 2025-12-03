/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_decoder (DECODER ONLY)
 * Purpose:      Market data deserializer factory - DECODING ONLY
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "../protocol_common.h"
#include <memory>
#include <string>

namespace beacon::decoder {

// Forward declarations
class MarketDataDecoder;

/**
 * @brief Factory for creating market data decoders (DECODING ONLY)
 */
class DecoderFactory {
public:
    /**
     * @brief Create market data decoder for specified exchange type
     * @param exchange Exchange type (NASDAQ, CME, NYSE)
     * @return Unique pointer to decoder, nullptr if invalid exchange
     */
    static std::unique_ptr<MarketDataDecoder> CreateDecoder(
        ExchangeType exchange
    );
    
    /**
     * @brief Create decoder from string
     * @param exchangeStr String representation of exchange ("nasdaq", "cme", "nyse")
     * @return Unique pointer to decoder, nullptr if invalid exchange
     */
    static std::unique_ptr<MarketDataDecoder> CreateDecoder(
        const std::string& exchangeStr
    );
};

} // namespace beacon::decoder