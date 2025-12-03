/*
 * =============================================================================
 * Project:      Beacon
 * Library:      beacon_encoder
 * Purpose:      NYSE execution encoder
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstdint>
#include <fstream>
#include <string>
#include <beacon_encoder/execution_message.h>
#include <beacon_encoder/encoder_concepts.h>
#include <beacon_exchange/protocol_common.h>

namespace beacon::encoder::nyse {

// NYSE Execution Encoder - zero overhead
class alignas(64) ExecutionEncoder {
private:
    std::ofstream _outputFile;
    uint64_t _messageCount{0};
    uint32_t _flushInterval;
    
    // Add missing private method declarations to match implementation
    __attribute__((hot, flatten, always_inline))
    size_t encodeNewOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept;
    
    __attribute__((hot, flatten, always_inline))
    size_t encodeModifyOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept;
    
    __attribute__((hot, flatten, always_inline))
    size_t encodeCancelOrder(const InternalExecutionMessage& message, uint8_t* buffer) noexcept;
    
public:
    explicit ExecutionEncoder(const std::string& outputPath, uint32_t flushInterval = 1000)
        : _outputFile(outputPath, std::ios::binary), _flushInterval(flushInterval) {}
    
    static constexpr size_t GetMaxMessageSize() noexcept { return 96; }
    static constexpr beacon::exchange::ExchangeType GetExchangeType() noexcept { 
        return beacon::exchange::ExchangeType::NYSE; 
    }
    
    __attribute__((hot, flatten, always_inline))
    size_t encode(const InternalExecutionMessage& message, uint8_t* buffer) noexcept;
};

// Validation
static_assert(beacon::encoder::ValidateEncoderPerformance<ExecutionEncoder, InternalExecutionMessage>());

} // namespace beacon::encoder::nyse

// Factory specialization
namespace beacon::encoder {

template<>
struct EncoderFactory<beacon::exchange::ExchangeType::NYSE, InternalExecutionMessage> {
    using type = EncoderDispatcher<nyse::ExecutionEncoder, InternalExecutionMessage>;
    
    template<typename... Args>
    static type create(Args&&... args) {
        return type(std::forward<Args>(args)...);
    }
};

} // namespace beacon::encoder
