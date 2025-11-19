#include <gtest/gtest.h>
#include <thread>
#include <chrono>
#include "../PlaybackState.h"

using namespace playback::rules;

class TestPlaybackState : public ::testing::Test {
protected:
    void SetUp() override {
        state = std::make_unique<PlaybackState>();
    }
    
    std::unique_ptr<PlaybackState> state;
};

TEST_F(TestPlaybackState, InitialState) {
    EXPECT_EQ(state->getCurrentMessageIndex(), 0);
    EXPECT_EQ(state->getTotalMessages(), 0);
    EXPECT_FALSE(state->isRunning());
    
    EXPECT_EQ(state->getTotalSent(), 0);
    EXPECT_EQ(state->getMessagesSent(), 0);
    EXPECT_EQ(state->getMessagesDropped(), 0);
    EXPECT_EQ(state->getMessagesQueued(), 0);
    EXPECT_EQ(state->getCurrentRate(), 0);
}

TEST_F(TestPlaybackState, PublicFieldsModification) {
    // Test that public fields can be modified directly
    state->setCurrentMessageIndex(42);
    state->initialize(1000);
    state->start();

    EXPECT_EQ(state->getCurrentMessageIndex(), 42);
    EXPECT_EQ(state->getTotalMessages(), 1000);
    EXPECT_TRUE(state->isRunning());
}

TEST_F(TestPlaybackState, MessageSentTracking) {
    state->recordSent();
    
    EXPECT_EQ(state->getTotalSent(), 1);
    EXPECT_EQ(state->getMessagesSent(), 1);
    
    // Send more messages
    for (int i = 0; i < 9; i++) {
        state->recordSent();
    }
    
    EXPECT_EQ(state->getTotalSent(), 10);
    EXPECT_EQ(state->getMessagesSent(), 10);
}

TEST_F(TestPlaybackState, MessageDroppedTracking) {
    state->recordDropped();
    state->recordDropped();
    
    EXPECT_EQ(state->getMessagesDropped(), 2);
    EXPECT_EQ(state->getMessagesSent(), 0); // Should not affect sent count
}

TEST_F(TestPlaybackState, MessageQueuedTracking) {
    state->recordQueued();
    state->recordQueued();
    state->recordQueued();
    
    EXPECT_EQ(state->getMessagesQueued(), 3);
    EXPECT_EQ(state->getMessagesSent(), 0); // Should not affect sent count
}

TEST_F(TestPlaybackState, MixedMessageTracking) {
    state->recordSent();
    state->recordSent();
    state->recordDropped();
    state->recordQueued();
    state->recordSent();
    
    EXPECT_EQ(state->getMessagesSent(), 3);
    EXPECT_EQ(state->getTotalSent(), 3);
    EXPECT_EQ(state->getMessagesDropped(), 1);
    EXPECT_EQ(state->getMessagesQueued(), 1);
}

TEST_F(TestPlaybackState, ElapsedTimeProgression) {
    auto initialTime = state->elapsedSeconds();
    EXPECT_GE(initialTime, 0.0);
    EXPECT_LT(initialTime, 0.1); // Should be very small initially
    
    // Wait a bit
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    
    auto laterTime = state->elapsedSeconds();
    EXPECT_GT(laterTime, initialTime);
    EXPECT_GE(laterTime, 0.01); // Should be at least 10ms
    
    // Test milliseconds version
    auto timeMs = state->elapsedMilliseconds();
    EXPECT_GE(timeMs, 10.0); // Should be at least 10ms
}

TEST_F(TestPlaybackState, CurrentRateCalculation) {
    // Initially no rate
    EXPECT_EQ(state->getCurrentRate(), 0);
    
    // Record some messages quickly
    for (int i = 0; i < 5; i++) {
        state->recordSent();
        std::this_thread::sleep_for(std::chrono::milliseconds(50)); // 50ms between messages
    }
    
    // Should have some rate (messages in last second)
    size_t rate = state->getCurrentRate();
    EXPECT_GT(rate, 0);
    EXPECT_LE(rate, 5); // Can't be more than total sent
}

TEST_F(TestPlaybackState, RateCalculationTimeWindow) {
    // Send messages spread over time
    state->recordSent();
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    state->recordSent();
    std::this_thread::sleep_for(std::chrono::milliseconds(600)); // Total > 1 second
    state->recordSent();
    
    // Should only count messages in last second
    size_t rate = state->getCurrentRate();
    EXPECT_LE(rate, 2); // First message should have aged out
}

TEST_F(TestPlaybackState, ResetFunctionality) {
    // Set up some state
    state->recordSent();
    state->recordSent();
    state->recordDropped();
    state->recordQueued();
    
    EXPECT_GT(state->getMessagesSent(), 0);
    EXPECT_GT(state->getMessagesDropped(), 0);
    EXPECT_GT(state->getMessagesQueued(), 0);
    
    // Reset should clear counters but preserve total sent
    size_t totalBeforeReset = state->getTotalSent();
    state->reset();
    
    EXPECT_EQ(state->getMessagesSent(), 0);
    EXPECT_EQ(state->getMessagesDropped(), 0);
    EXPECT_EQ(state->getMessagesQueued(), 0);
    EXPECT_EQ(state->getTotalSent(), totalBeforeReset); // Total should be preserved
}

TEST_F(TestPlaybackState, StartTimeConsistency) {
    auto startTime1 = state->getStartTime();
    
    // Wait a bit
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    
    auto startTime2 = state->getStartTime();
    
    // Start time should remain constant
    EXPECT_EQ(startTime1, startTime2);
}

TEST_F(TestPlaybackState, ElapsedTimeConsistentWithStartTime) {
    auto startTime = state->getStartTime();
    
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    
    auto now = std::chrono::steady_clock::now();
    auto expectedElapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime).count();
    auto actualElapsed = state->elapsedMilliseconds();
    
    // Should be approximately equal (within 10ms tolerance)
    EXPECT_NEAR(actualElapsed, expectedElapsed, 10.0);
}

TEST_F(TestPlaybackState, LongRunningRateCalculation) {
    // Test rate calculation over longer period
    const size_t messagesPerBatch = 10;
    const size_t numBatches = 3;
    
    for (size_t batch = 0; batch < numBatches; batch++) {
        for (size_t i = 0; i < messagesPerBatch; i++) {
            state->recordSent();
            std::this_thread::sleep_for(std::chrono::milliseconds(20)); // 50 msg/sec rate
        }
        
        // Check rate after each batch
        size_t rate = state->getCurrentRate();
        EXPECT_GT(rate, 0);
    }
    
    // Final rate check
    size_t finalRate = state->getCurrentRate();
    EXPECT_GT(finalRate, 0);
    EXPECT_LE(finalRate, 50); // Shouldn't exceed theoretical maximum
}

TEST_F(TestPlaybackState, HighFrequencySending) {
    // Test with very high frequency message sending
    const size_t numMessages = 100;
    
    for (size_t i = 0; i < numMessages; i++) {
        state->recordSent();
        // No delay - send as fast as possible
    }
    
    EXPECT_EQ(state->getTotalSent(), numMessages);
    EXPECT_EQ(state->getMessagesSent(), numMessages);
    
    // Rate should reflect recent high activity
    size_t rate = state->getCurrentRate();
    EXPECT_GT(rate, 0);
}

TEST_F(TestPlaybackState, ConcurrentAccess) {
    // Test thread safety of state operations
    const size_t numThreads = 4;
    const size_t messagesPerThread = 100;
    
    std::vector<std::thread> threads;
    
    for (size_t t = 0; t < numThreads; t++) {
        threads.emplace_back([this, messagesPerThread]() {
            for (size_t i = 0; i < messagesPerThread; i++) {
                state->recordSent();
                std::this_thread::sleep_for(std::chrono::microseconds(100));
            }
        });
    }
    
    // Wait for all threads
    for (auto& thread : threads) {
        thread.join();
    }
    
    // Verify final counts
    EXPECT_EQ(state->getTotalSent(), numThreads * messagesPerThread);
    EXPECT_EQ(state->getMessagesSent(), numThreads * messagesPerThread);
}

TEST_F(TestPlaybackState, TypeAliases) {
    // Verify type aliases work correctly
    PlaybackState::TimePoint tp = state->getStartTime();
    PlaybackState::Duration dur = state->elapsedTime();
    
    EXPECT_TRUE(std::chrono::steady_clock::is_steady);
    EXPECT_GE(dur.count(), 0);
}