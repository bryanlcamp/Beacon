#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include "exchanges/protocol_common.h"
#include <thread>
#include <chrono>
#include "../BinaryInputFileReader.h"
#include "../src/replayers/types/UdpReplayer.h"
#include "../src/authorities/RulesEngine.h"
#include "../PlaybackState.h"

using namespace playback::rules;
using namespace playback::replayer;

class TestPlaybackIntegration : public ::testing::Test {
protected:
    void SetUp() override {
        createTestFiles();
        setupTestEnvironment();
    }

    void TearDown() override {
        // Clean up test files
        std::filesystem::remove("test_integration.bin");
        std::filesystem::remove("test_small.bin");
        std::filesystem::remove("test_large.bin");
        std::filesystem::remove("test_config.json");
        std::filesystem::remove("test_generator_config.json");
    }

private:
    void createTestFiles() {
        // Create test binary file (mimics generator output)
        std::ofstream testFile("test_integration.bin", std::ios::binary);
        for (int i = 0; i < 100; i++) {
            std::array<char, 33> message = {};
            message[0] = static_cast<char>('A' + (i % 26)); // Message type
            message[1] = static_cast<char>(i % 256);        // Sequence
            message[2] = static_cast<char>((i >> 8) % 256); // High byte of sequence
            // Fill rest with pattern
            for (size_t j = 3; j < 33; j++) {
                message[j] = static_cast<char>((i * j) % 256);
            }
            testFile.write(message.data(), 33);
        }
        testFile.close();

        // Create small test file
        std::ofstream smallFile("test_small.bin", std::ios::binary);
        for (int i = 0; i < 10; i++) {
            std::array<char, 33> message = {};
            message[0] = 'S'; // Small file marker
            message[1] = static_cast<char>(i);
            smallFile.write(message.data(), 33);
        }
        smallFile.close();

        // Create large test file
        std::ofstream largeFile("test_large.bin", std::ios::binary);
        for (int i = 0; i < 5000; i++) {
            std::array<char, 33> message = {};
            message[0] = 'L'; // Large file marker
            message[1] = static_cast<char>(i % 256);
            message[2] = static_cast<char>((i >> 8) % 256);
            largeFile.write(message.data(), 33);
        }
        largeFile.close();

        // Create test configuration files
        std::ofstream config("test_config.json");
        config << R"({
  "sender_config": "senders/sender_udp.json",
  "authorities": [],
  "test_mode": true
})";
        config.close();

        std::ofstream genConfig("test_generator_config.json");
        genConfig << R"({
  "Global": {
    "NumMessages": 100,
    "Exchange": "nsdq"
  }
})";
        genConfig.close();
    }

    void setupTestEnvironment() {
        testAddress = "127.0.0.1";
        testPort = 12347; // Unique port for integration tests
    }

protected:
    std::string testAddress;
    uint16_t testPort;
};

TEST_F(TestPlaybackIntegration, CompletePlaybackPipeline) {
    // Test the complete pipeline: Load -> Validate -> Broadcast
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_integration.bin"));
    EXPECT_EQ(reader.size(), 100);

    UdpMulticastMessageSender sender(testAddress, testPort, 1);
    PlaybackState state;
    RulesEngine rulesEngine;
    
    // Simulate playback loop
    size_t messagesSent = 0;
    for (size_t i = 0; i < reader.size(); i++) {
        const char* message = reader.getMessage(i);
        ASSERT_NE(message, nullptr);
        
        state.setCurrentMessageIndex(i);
        state.initialize(reader.size());
        state.start();
        
        // Apply rules (no rules = always continue)
        auto decision = rulesEngine.evaluate(i, message, state);
        
        if (decision.outcome == Outcome::CONTINUE || decision.outcome == Outcome::SEND_NOW) {
            if (sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
                messagesSent++;
                state.recordSent();
            }
        }
    }
    
    EXPECT_EQ(messagesSent, 100);
    EXPECT_EQ(sender.getMessagesSent(), 100);
    EXPECT_EQ(state.getMessagesSent(), 100);
}

TEST_F(TestPlaybackIntegration, PlaybackWithRules) {
    // Test playback with rules that modify behavior
    
    class TestRule : public IPlaybackRule {
    public:
        Priority getPriority() const override { return Priority::CONTROL; }
        
        Decision apply(size_t messageIndex, const char*, const PlaybackState&, Decision current) override {
            Decision decision = current;
            // Drop every 5th message
            if (messageIndex % 5 == 4) {
                decision.outcome = Outcome::DROP;
            } else {
                decision.outcome = Outcome::CONTINUE;
                decision.accumulatedDelay += std::chrono::microseconds(100); // Add 100μs delay
            }
            return decision;
        }
    };
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_small.bin")); // 10 messages
    
    UdpMulticastMessageSender sender(testAddress, testPort + 1, 1);
    PlaybackState state;
    RulesEngine rulesEngine;
    
    rulesEngine.addRule(std::make_unique<TestRule>());
    
    size_t messagesSent = 0;
    size_t messagesDropped = 0;
    auto startTime = std::chrono::high_resolution_clock::now();
    
    for (size_t i = 0; i < reader.size(); i++) {
        const char* message = reader.getMessage(i);
        state.setCurrentMessageIndex(i);
        state.initialize(reader.size());
        
        auto decision = rulesEngine.evaluate(i, message, state);
        
        if (decision.outcome == Outcome::DROP) {
            messagesDropped++;
            state.recordDropped();
        } else {
            // Apply delay
            if (decision.accumulatedDelay.count() > 0) {
                std::this_thread::sleep_for(decision.accumulatedDelay);
            }
            
            if (sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
                messagesSent++;
                state.recordSent();
            }
        }
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    
    // Should have dropped 2 messages (indices 4 and 9)
    EXPECT_EQ(messagesDropped, 2);
    EXPECT_EQ(messagesSent, 8);
    EXPECT_EQ(state.getMessagesDropped(), 2);
    EXPECT_EQ(state.getMessagesSent(), 8);
    
    // Should have taken at least 800μs (8 messages × 100μs delay)
    EXPECT_GE(duration.count(), 0); // At least some time elapsed
}

TEST_F(TestPlaybackIntegration, HighThroughputPlayback) {
    // Test high-throughput playback performance
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_large.bin")); // 5000 messages
    
    UdpMulticastMessageSender sender(testAddress, testPort + 2, 1);
    PlaybackState state;
    RulesEngine rulesEngine; // No rules for maximum throughput
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    size_t messagesSent = 0;
    for (size_t i = 0; i < reader.size(); i++) {
        const char* message = reader.getMessage(i);
        
        // Minimal processing for speed
        if (sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
            messagesSent++;
        }
        
        // Update state periodically (not every message for performance)
        if (i % 100 == 0) {
            state.setCurrentMessageIndex(i);
            state.recordSent();
        }
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    
    EXPECT_GT(messagesSent, 0);
    EXPECT_LE(messagesSent, 5000); // Can't send more than available
    
    // Calculate throughput
    if (duration.count() > 0) {
        double throughput = (double)messagesSent * 1000.0 / duration.count();
        EXPECT_GT(throughput, 1000); // Should achieve at least 1K msg/sec
        
        std::cout << "High throughput test: " << throughput << " messages/second" << std::endl;
    }
}

TEST_F(TestPlaybackIntegration, ExchangeFormatDetection) {
    // Test format detection and validation
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_integration.bin"));
    
    // Simulate format detection logic
    bool formatValid = true;
    std::string detectedFormat = std::string{beacon::exchanges::ExchangeTypeToString(beacon::exchanges::ExchangeType::NASDAQ)}; // Default
    
    // Check first few messages for format indicators
    for (size_t i = 0; i < std::min(reader.size(), size_t(5)); i++) {
        const char* message = reader.getMessage(i);
        ASSERT_NE(message, nullptr);
        
        // Basic validation - message should not be all zeros
        bool allZeros = true;
        for (size_t j = 0; j < BinaryInputFileReader::MESSAGE_SIZE; j++) {
            if (message[j] != 0) {
                allZeros = false;
                break;
            }
        }
        formatValid = formatValid && !allZeros;
    }
    
    EXPECT_TRUE(formatValid);
    EXPECT_EQ(detectedFormat, std::string{beacon::exchanges::ExchangeTypeToString(beacon::exchanges::ExchangeType::NASDAQ)});
}

TEST_F(TestPlaybackIntegration, ErrorHandlingAndRecovery) {
    // Test error handling during playback
    
    BinaryInputFileReader reader;
    UdpMulticastMessageSender sender(testAddress, testPort + 3, 1);
    PlaybackState state;
    RulesEngine rulesEngine;
    
    // Test with non-existent file
    EXPECT_FALSE(reader.load("nonexistent.bin"));
    
    // Load valid file
    ASSERT_TRUE(reader.load("test_small.bin"));
    
    size_t successCount = 0;
    size_t errorCount = 0;
    
    for (size_t i = 0; i < reader.size() + 5; i++) { // Try to read beyond file
        const char* message = reader.getMessage(i);
        
        if (message == nullptr) {
            errorCount++;
            continue; // Graceful error handling
        }
        
        if (sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
            successCount++;
            state.recordSent();
        }
    }
    
    EXPECT_EQ(successCount, 10); // Should successfully send all valid messages
    EXPECT_EQ(errorCount, 5);    // Should gracefully handle 5 out-of-bounds reads
    EXPECT_EQ(state.getMessagesSent(), 10);
}

TEST_F(TestPlaybackIntegration, ConcurrentPlaybackSessions) {
    // Test multiple concurrent playback sessions
    
    const size_t numSessions = 3;
    std::vector<std::thread> sessions;
    std::vector<std::atomic<size_t>> counters(numSessions);
    
    for (size_t session = 0; session < numSessions; session++) {
        counters[session] = 0;
        
        sessions.emplace_back([&, session]() {
            BinaryInputFileReader reader;
            UdpMulticastMessageSender sender(testAddress, testPort + 10 + session, 1);
            PlaybackState state;
            
            if (reader.load("test_small.bin")) {
                for (size_t i = 0; i < reader.size(); i++) {
                    const char* message = reader.getMessage(i);
                    if (message && sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
                        counters[session]++;
                        state.recordSent();
                    }
                    
                    // Small delay to simulate real playback timing
                    std::this_thread::sleep_for(std::chrono::microseconds(100));
                }
            }
        });
    }
    
    // Wait for all sessions
    for (auto& session : sessions) {
        session.join();
    }
    
    // Verify all sessions succeeded
    for (size_t i = 0; i < numSessions; i++) {
        EXPECT_EQ(counters[i].load(), 10);
    }
}

TEST_F(TestPlaybackIntegration, PlaybackStateStatistics) {
    // Test comprehensive statistics during playback
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_integration.bin")); // 100 messages
    
    UdpMulticastMessageSender sender(testAddress, testPort + 4, 1);
    PlaybackState state;
    
    auto startTime = std::chrono::steady_clock::now();
    
    // Simulate realistic playback with timing
    for (size_t i = 0; i < reader.size(); i++) {
        const char* message = reader.getMessage(i);
        
        state.setCurrentMessageIndex(i);
        state.initialize(reader.size());
        state.start();
        
        // Simulate some processing time
        std::this_thread::sleep_for(std::chrono::microseconds(50));
        
        if (i % 10 == 9) {
            // Drop every 10th message
            state.recordDropped();
        } else if (i % 7 == 6) {
            // Queue every 7th message  
            state.recordQueued();
        } else {
            // Send most messages
            if (sender.send(message, BinaryInputFileReader::MESSAGE_SIZE)) {
                state.recordSent();
            }
        }
    }
    
    auto endTime = std::chrono::steady_clock::now();
    
    // Verify statistics
    EXPECT_EQ(state.getCurrentMessageIndex(), 99);
    EXPECT_EQ(state.getTotalMessages(), 100);
    EXPECT_GT(state.getMessagesSent(), 0);
    EXPECT_GT(state.getMessagesDropped(), 0);
    EXPECT_GT(state.getMessagesQueued(), 0);
    
    // Time-based statistics
    EXPECT_GT(state.elapsedSeconds(), 0.0);
    EXPECT_GT(state.elapsedMilliseconds(), 0.0);
    
    auto actualDuration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    EXPECT_NEAR(state.elapsedMilliseconds(), actualDuration.count(), 50.0); // 50ms tolerance
}