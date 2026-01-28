#include "FastSimMessages.h"
#include <iostream>

int main() {
    // Example: Encode and decode a PriceMessage
    PriceMessage priceMsg{PriceType::Bid, 101.25, 500};
    uint8_t priceBuffer[1 + sizeof(double) + sizeof(uint32_t)];
    priceMsg.encode(priceBuffer);
    PriceMessage decodedPrice = PriceMessage::decode(priceBuffer);
    std::cout << "Decoded PriceMessage: type=" << (int)decodedPrice.type << ", price=" << decodedPrice.price << ", size=" << decodedPrice.size << std::endl;

    // Example: Encode and decode an OrderExecutionMessage
    OrderExecutionMessage orderMsg{12345678, 101.50, 250, true};
    uint8_t orderBuffer[sizeof(uint64_t) + sizeof(double) + sizeof(uint32_t) + 1];
    orderMsg.encode(orderBuffer);
    OrderExecutionMessage decodedOrder = OrderExecutionMessage::decode(orderBuffer);
    std::cout << "Decoded OrderExecutionMessage: orderId=" << decodedOrder.orderId << ", price=" << decodedOrder.price << ", size=" << decodedOrder.size << ", isBuy=" << decodedOrder.isBuy << std::endl;

    return 0;
}
