/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      NASDAQ OUCH execution encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/nasdaq/execution_encoder.h>
#include <cstring>

namespace beacon::encoder::nasdaq {

// Simple placeholder structures - no external protocol dependencies
namespace {
    struct SimpleNewOrder {
        char messageType;
        uint64_t orderToken;
        uint64_t clOrdId;
        char side;
        uint32_t orderQty;
        uint32_t price;
        char timeInForce;
        char symbol[8];
    } __attribute__((packed));
    
    struct SimpleModifyOrder {
        char messageType;
        uint64_t orderToken;
        uint32_t newQty;
        uint32_t newPrice;
    } __attribute__((packed));
    
    struct SimpleCancelOrder {
        char messageType;
        uint64_t orderToken;
    } __attribute__((packed));
    
    struct SimpleReplaceOrder {
        char messageType;
        uint64_t existingOrderToken;
        uint64_t replacementOrderToken;
        uint32_t newQty;
        uint32_t newPrice;
    } __attribute__((packed));
}

size_t ExecutionEncoder::encode(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    switch (message.messageType) {
        case 'N': return encodeNewOrder(message, buffer);
        case 'U': return encodeModifyOrder(message, buffer);  
        case 'X': return encodeCancelOrder(message, buffer);
        case 'R': return encodeReplaceOrder(message, buffer);
        default: return 0;
    }
}

size_t ExecutionEncoder::encodeNewOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleNewOrder* newOrder = reinterpret_cast<SimpleNewOrder*>(buffer);
    
    newOrder->messageType = 'O'; // OUCH New Order Single
    newOrder->orderToken = message.orderToken;
    newOrder->clOrdId = message.clOrdId;
    newOrder->side = message.side;
    newOrder->orderQty = message.quantity;
    newOrder->price = message.price;
    newOrder->timeInForce = message.timeInForce;
    
    // Copy symbol with proper padding
    std::memset(newOrder->symbol, ' ', sizeof(newOrder->symbol));
    std::memcpy(newOrder->symbol, message.symbol, 
                std::min(static_cast<size_t>(message.symbolLength), sizeof(newOrder->symbol)));
    
    return sizeof(SimpleNewOrder);
}

size_t ExecutionEncoder::encodeModifyOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleModifyOrder* modifyOrder = reinterpret_cast<SimpleModifyOrder*>(buffer);
    
    modifyOrder->messageType = 'U'; // OUCH Modify Order
    modifyOrder->orderToken = message.orderToken;
    modifyOrder->newQty = message.quantity;
    modifyOrder->newPrice = message.price;
    
    return sizeof(SimpleModifyOrder);
}

size_t ExecutionEncoder::encodeCancelOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleCancelOrder* cancelOrder = reinterpret_cast<SimpleCancelOrder*>(buffer);
    
    cancelOrder->messageType = 'X'; // OUCH Cancel Order
    cancelOrder->orderToken = message.orderToken;
    
    return sizeof(SimpleCancelOrder);
}

size_t ExecutionEncoder::encodeReplaceOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleReplaceOrder* replaceOrder = reinterpret_cast<SimpleReplaceOrder*>(buffer);
    
    replaceOrder->messageType = 'R'; // OUCH Replace Order
    replaceOrder->existingOrderToken = message.orderToken;
    replaceOrder->replacementOrderToken = message.orderToken + 1; // Generate new token
    replaceOrder->newQty = message.quantity;
    replaceOrder->newPrice = message.price;
    
    return sizeof(SimpleReplaceOrder);
}

} // namespace beacon::encoder::nasdaq
