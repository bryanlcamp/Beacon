/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      NYSE execution encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/nyse/execution_encoder.h>
#include <cstring>

namespace beacon::encoder::nyse {

// Simple placeholder structures - no external protocol dependencies
namespace {
    struct SimpleNewOrder {
        char msgType;
        uint64_t clOrdId;
        char side;
        uint32_t orderQty;
        uint32_t price;
        char ordType;
        char timeInForce;
        char symbol[8];
    } __attribute__((packed));
    
    struct SimpleModifyOrder {
        char msgType;
        uint64_t orderToken;
        uint64_t clOrdId;
        uint32_t orderQty;
        uint32_t price;
    } __attribute__((packed));
    
    struct SimpleCancelOrder {
        char msgType;
        uint64_t orderToken;
        uint64_t clOrdId;
    } __attribute__((packed));
}

size_t ExecutionEncoder::encode(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    switch (message.messageType) {
        case 'N': return encodeNewOrder(message, buffer);
        case 'U': return encodeModifyOrder(message, buffer);
        case 'X': return encodeCancelOrder(message, buffer);
        default: return 0;
    }
}

size_t ExecutionEncoder::encodeNewOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleNewOrder* newOrder = reinterpret_cast<SimpleNewOrder*>(buffer);
    
    newOrder->msgType = 'D'; // NYSE New Order message type
    newOrder->clOrdId = message.clOrdId;
    newOrder->side = message.side;
    newOrder->orderQty = message.quantity;
    newOrder->price = message.price;
    newOrder->ordType = message.orderType;
    newOrder->timeInForce = message.timeInForce;
    
    // Copy symbol with proper padding
    std::memset(newOrder->symbol, ' ', sizeof(newOrder->symbol));
    std::memcpy(newOrder->symbol, message.symbol,
                std::min(static_cast<size_t>(message.symbolLength), sizeof(newOrder->symbol)));
    
    return sizeof(SimpleNewOrder);
}

size_t ExecutionEncoder::encodeModifyOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleModifyOrder* modifyOrder = reinterpret_cast<SimpleModifyOrder*>(buffer);
    
    modifyOrder->msgType = 'G'; // NYSE Modify Order message type
    modifyOrder->orderToken = message.orderToken;
    modifyOrder->clOrdId = message.clOrdId;
    modifyOrder->orderQty = message.quantity;
    modifyOrder->price = message.price;
    
    return sizeof(SimpleModifyOrder);
}

size_t ExecutionEncoder::encodeCancelOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleCancelOrder* cancelOrder = reinterpret_cast<SimpleCancelOrder*>(buffer);
    
    cancelOrder->msgType = 'F'; // NYSE Cancel Order message type
    cancelOrder->orderToken = message.orderToken;
    cancelOrder->clOrdId = message.clOrdId;
    
    return sizeof(SimpleCancelOrder);
}

} // namespace beacon::encoder::nyse
