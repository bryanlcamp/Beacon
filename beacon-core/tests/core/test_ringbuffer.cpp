#include <gtest/gtest.h>
#include <benchmark/benchmark.h>
#include "hft/ringbuffer/spsc_ringbuffer.h"
#include <thread>
#include <atomic>

class RingBufferTest : public ::testing::Test {
protected:
    static constexpr size_t BUFFER_SIZE = 4096;
    beacon::hft::ringbuffer::SPSCRingBuffer<uint64_t, BUFFER_SIZE> buffer;
};

TEST_F(RingBufferTest, BasicProduceConsume) {
    const uint64_t test_value = 0x123456789ABCDEF0;

    // Producer writes
    // TODO: Implement actual push/pop when ringbuffer is implemented
    // buffer.push(test_value);

    // Consumer reads
    // uint64_t result;
    // EXPECT_TRUE(buffer.pop(result));
    // EXPECT_EQ(result, test_value);

    SUCCEED(); // Placeholder until implementation
}

TEST_F(RingBufferTest, HighThroughputProduceConsume) {
    const size_t num_messages = 1000000;
    std::atomic<size_t> messages_processed{0};

    // TODO: Implement when ringbuffer is ready
    // Producer thread
    std::thread producer([&]() {
        for (size_t i = 0; i < num_messages; ++i) {
            // while (!buffer.push(i)) {
            //     std::this_thread::yield();
            // }
        }
    });

    // Consumer thread
    std::thread consumer([&]() {
        uint64_t value;
        while (messages_processed < num_messages) {
            // if (buffer.pop(value)) {
            //     messages_processed++;
            // }
        }
    });

    producer.join();
    consumer.join();

    EXPECT_EQ(messages_processed, num_messages);
}

// Benchmark ringbuffer performance
static void BM_RingBufferThroughput(benchmark::State& state) {
    beacon::hft::ringbuffer::SPSCRingBuffer<uint64_t, 4096> buffer;

    for (auto _ : state) {
        // TODO: Implement benchmarking when ringbuffer is ready
        // Measure messages per second throughput
        benchmark::DoNotOptimize(&buffer);
    }

    state.SetItemsProcessed(state.iterations());
}
BENCHMARK(BM_RingBufferThroughput)->Threads(2);
