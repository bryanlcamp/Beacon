#pragma once
#include <cstdint>
#include <vector>
#include <cstring>

enum class PriceType : uint8_t {
    Bid = 0,
    Ask = 1,
    Last = 2
};

struct alignas(64) PriceMessage {
    PriceType type;
    double price;
    uint32_t size;

    // Encode to buffer
    void encode(uint8_t* buffer) const {
        buffer[0] = static_cast<uint8_t>(type);
        std::memcpy(buffer + 1, &price, sizeof(price));
        std::memcpy(buffer + 1 + sizeof(price), &size, sizeof(size));
    }

    // Decode from buffer
    static PriceMessage decode(const uint8_t* buffer) {
        PriceMessage msg;
        msg.type = static_cast<PriceType>(buffer[0]);
        std::memcpy(&msg.price, buffer + 1, sizeof(msg.price));
        std::memcpy(&msg.size, buffer + 1 + sizeof(msg.price), sizeof(msg.size));
        return msg;
    }
};

struct alignas(64) OrderExecutionMessage {
    uint64_t orderId;
    double price;
    uint32_t size;
    bool isBuy;

    void encode(uint8_t* buffer) const {
        std::memcpy(buffer, &orderId, sizeof(orderId));
        std::memcpy(buffer + sizeof(orderId), &price, sizeof(price));
        std::memcpy(buffer + sizeof(orderId) + sizeof(price), &size, sizeof(size));
        buffer[sizeof(orderId) + sizeof(price) + sizeof(size)] = isBuy ? 1 : 0;
    }

    static OrderExecutionMessage decode(const uint8_t* buffer) {
        OrderExecutionMessage msg;
        std::memcpy(&msg.orderId, buffer, sizeof(msg.orderId));
        std::memcpy(&msg.price, buffer + sizeof(msg.orderId), sizeof(msg.price));
        std::memcpy(&msg.size, buffer + sizeof(msg.orderId) + sizeof(msg.price), sizeof(msg.size));
        msg.isBuy = buffer[sizeof(msg.orderId) + sizeof(msg.price) + sizeof(msg.size)] != 0;
        return msg;
    }
};
