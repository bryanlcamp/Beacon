/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      CME iLink3 execution encoder implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_encoder/cme/execution_encoder.h>
#include <cstring>

namespace beacon::encoder::cme {

// Simple placeholder structures - no external protocol dependencies
namespace {
    struct SimpleNewOrder {
        uint16_t templateId;
        uint64_t clOrdId;
        uint32_t securityId;
        uint8_t side;
        uint32_t orderQty;
        uint32_t price;
        uint8_t ordType;
        uint8_t timeInForce;
    } __attribute__((packed));
    
    struct SimpleModifyOrder {
        uint16_t templateId;
        uint64_t orderToken;
        uint64_t clOrdId;
        uint32_t orderQty;
        uint32_t price;
    } __attribute__((packed));
    
    struct SimpleCancelOrder {
        uint16_t templateId;
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
    
    newOrder->templateId = 514; // iLink3 New Order Single template
    newOrder->clOrdId = message.clOrdId;
    newOrder->securityId = 12345; // Default security ID
    newOrder->side = (message.side == 'B') ? 1 : 2; // 1=Buy, 2=Sell
    newOrder->orderQty = message.quantity;
    newOrder->price = message.price;
    newOrder->ordType = (message.orderType == 'M') ? 1 : 2; // 1=Market, 2=Limit
    newOrder->timeInForce = 0; // Day order
    
    return sizeof(SimpleNewOrder);
}

size_t ExecutionEncoder::encodeModifyOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleModifyOrder* modifyOrder = reinterpret_cast<SimpleModifyOrder*>(buffer);
    
    modifyOrder->templateId = 515; // iLink3 Cancel/Replace template
    modifyOrder->orderToken = message.orderToken;
    modifyOrder->clOrdId = message.clOrdId;
    modifyOrder->orderQty = message.quantity;
    modifyOrder->price = message.price;
    
    return sizeof(SimpleModifyOrder);
}

size_t ExecutionEncoder::encodeCancelOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept {
    SimpleCancelOrder* cancelOrder = reinterpret_cast<SimpleCancelOrder*>(buffer);
    
    cancelOrder->templateId = 516; // iLink3 Cancel template
    cancelOrder->orderToken = message.orderToken;
    cancelOrder->clOrdId = message.clOrdId;
    
    return sizeof(SimpleCancelOrder);
}

} // namespace beacon::encoder::cme
