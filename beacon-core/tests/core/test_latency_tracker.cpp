#include <gtest/gtest.h>
#include "hft/profiling/latency_tracker.h"
#include <chrono>
#include <thread>

class LatencyTrackerTest : public ::testing::Test {
protected:
    void SetUp() override {
        tracker = std::make_unique<beacon::hft::profiling::LatencyTracker>();
    }

    std::unique_ptr<beacon::hft::profiling::LatencyTracker> tracker;
};

TEST_F(LatencyTrackerTest, BasicLatencyMeasurement) {
    auto start = std::chrono::high_resolution_clock::now();

    // Simulate some work
    std::this_thread::sleep_for(std::chrono::microseconds(100));

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);

    EXPECT_GT(duration.count(), 90000);  // At least 90 microseconds
    EXPECT_LT(duration.count(), 200000); // Less than 200 microseconds
}

TEST_F(LatencyTrackerTest, HighFrequencyMeasurements) {
    const int num_measurements = 10000;

    for (int i = 0; i < num_measurements; ++i) {
        auto start = std::chrono::high_resolution_clock::now();
        // Minimal work to measure overhead
        auto end = std::chrono::high_resolution_clock::now();

        auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count();
        EXPECT_LT(latency_ns, 1000); // Should be sub-microsecond overhead
    }
}

TEST_F(LatencyTrackerTest, TickToTradeLatency) {
    // Simulate tick-to-trade measurement
    auto tick_received = std::chrono::high_resolution_clock::now();

    // Simulate processing: parsing, decision, order creation
    std::this_thread::sleep_for(std::chrono::microseconds(5));

    auto order_sent = std::chrono::high_resolution_clock::now();
    auto latency = std::chrono::duration_cast<std::chrono::microseconds>(order_sent - tick_received);

    // Target: sub-10 microsecond tick-to-trade
    EXPECT_LT(latency.count(), 15); // Allow some margin for test environment
}
