#pragma once
// Exchange protocol type definitions
namespace beacon { namespace exchange {
    enum class ExchangeType {
        CME,
        NASDAQ,
        NYSE
    };

    enum class ProtocolType {
        EXECUTION,
        MARKET_DATA
    };
}}
