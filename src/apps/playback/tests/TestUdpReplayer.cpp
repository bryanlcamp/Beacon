#include <gtest/gtest.h>
#include <thread>
#include <chrono>
#include "../src/replayers/types/UdpReplayer.h"

using namespace playback::replayer;

class TestUdpReplayer : public ::testing::Test {
protected:
    void SetUp() override {
        // Use localhost for testing
        testAddress = "127.0.0.1";
        testPort = 12346; // Different from default to avoid conflicts
        testTtl = 1;
    }

    void TearDown() override {
        // Clean up any resources
    }

    std::string testAddress;
    uint16_t testPort;
    uint8_t testTtl;
};

TEST_F(TestUdpReplayer, ConstructorAndBasicProperties) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    EXPECT_EQ(sender.address(), testAddress);
    EXPECT_EQ(sender.port(), testPort);
    EXPECT_GE(sender.fd(), 0); // Valid socket file descriptor
    EXPECT_EQ(sender.getMessagesSent(), 0); // No messages sent initially
}

TEST_F(TestUdpReplayer, SendSingleMessage) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    const char* testMessage = "Hello, UDP World!";
    size_t messageLength = strlen(testMessage);
    
    // Send message
    bool result = sender.send(testMessage, messageLength);
    
    // On localhost, send should succeed (even if no one is listening)
    EXPECT_TRUE(result);
    EXPECT_EQ(sender.getMessagesSent(), 1);
}

TEST_F(TestUdpReplayer, SendMultipleMessages) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    const size_t numMessages = 10;
    for (size_t i = 0; i < numMessages; i++) {
        std::string message = "Test message #" + std::to_string(i);
        bool result = sender.send(message.c_str(), message.length());
        EXPECT_TRUE(result);
    }
    
    EXPECT_EQ(sender.getMessagesSent(), numMessages);
}

TEST_F(TestUdpReplayer, SendBinaryData) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    // Create binary test data (33-byte message like from generator)
    std::array<char, 33> binaryMessage = {};
    binaryMessage[0] = 0x41; // 'A'
    binaryMessage[1] = 0x00; // Message type
    binaryMessage[32] = 0xFF; // End marker
    
    bool result = sender.send(binaryMessage.data(), binaryMessage.size());
    EXPECT_TRUE(result);
    EXPECT_EQ(sender.getMessagesSent(), 1);
}

TEST_F(TestUdpReplayer, SendZeroLengthMessage) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    const char* emptyMessage = "";
    bool result = sender.send(emptyMessage, 0);
    
    // Zero-length messages should be handled gracefully
    EXPECT_TRUE(result);
    EXPECT_EQ(sender.getMessagesSent(), 1);
}

TEST_F(TestUdpReplayer, SendNullMessage) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    // Sending null pointer should be handled safely
    bool result = sender.send(nullptr, 10);
    EXPECT_FALSE(result); // Should fail safely
    EXPECT_EQ(sender.getMessagesSent(), 0); // Counter should not increment
}

TEST_F(TestUdpReplayer, FlushOperation) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    // Send some messages
    const char* testMessage = "Test flush";
    sender.send(testMessage, strlen(testMessage));
    
    // Flush should not throw (it's a no-op for UDP)
    EXPECT_NO_THROW(sender.flush());
    EXPECT_EQ(sender.getMessagesSent(), 1); // Count should remain unchanged
}

TEST_F(TestUdpReplayer, HighThroughputTest) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    // Test sending many messages quickly
    const size_t numMessages = 1000;
    const char* message = "High throughput test message";
    size_t messageLength = strlen(message);
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    size_t successCount = 0;
    for (size_t i = 0; i < numMessages; i++) {
        if (sender.send(message, messageLength)) {
            successCount++;
        }
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    
    EXPECT_EQ(sender.getMessagesSent(), successCount);
    EXPECT_GT(successCount, 0); // At least some messages should succeed
    
    // Calculate throughput (messages per second)
    if (duration.count() > 0) {
        double throughput = (double)successCount * 1000.0 / duration.count();
        EXPECT_GT(throughput, 100); // Should achieve at least 100 msg/sec
        
        // Log performance for debugging
        std::cout << "Throughput: " << throughput << " messages/second" << std::endl;
    }
}

TEST_F(TestUdpReplayer, MessageSizeVariations) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    // Test different message sizes
    std::vector<size_t> messageSizes = {1, 10, 33, 100, 500, 1000, 1400}; // Up to near MTU
    
    for (size_t size : messageSizes) {
        std::vector<char> message(size, 'X');
        bool result = sender.send(message.data(), size);
        EXPECT_TRUE(result) << "Failed to send message of size " << size;
    }
    
    EXPECT_EQ(sender.getMessagesSent(), messageSizes.size());
}

TEST_F(TestUdpReplayer, ConcurrentSending) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    const size_t numThreads = 4;
    const size_t messagesPerThread = 100;
    std::vector<std::thread> threads;
    std::atomic<size_t> totalSent{0};
    
    // Launch multiple threads sending messages
    for (size_t t = 0; t < numThreads; t++) {
        threads.emplace_back([&sender, &totalSent, messagesPerThread, t]() {
            for (size_t i = 0; i < messagesPerThread; i++) {
                std::string message = "Thread " + std::to_string(t) + " message " + std::to_string(i);
                if (sender.send(message.c_str(), message.length())) {
                    totalSent++;
                }
                
                // Small delay to simulate realistic timing
                std::this_thread::sleep_for(std::chrono::microseconds(10));
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    // Verify results
    EXPECT_EQ(sender.getMessagesSent(), totalSent.load());
    EXPECT_GT(totalSent.load(), 0);
}

TEST_F(TestUdpReplayer, CopyConstructorDisabled) {
    // Verify copy constructor and assignment are deleted
    static_assert(!std::is_copy_constructible_v<UdpMulticastMessageSender>, 
                  "UdpMulticastMessageSender should not be copy constructible");
    static_assert(!std::is_copy_assignable_v<UdpMulticastMessageSender>,
                  "UdpMulticastMessageSender should not be copy assignable");
}

TEST_F(TestUdpReplayer, SocketFileDescriptorValid) {
    UdpMulticastMessageSender sender(testAddress, testPort, testTtl);
    
    int fd = sender.fd();
    EXPECT_GE(fd, 0); // Valid file descriptor
    
    // Try to send data to verify socket is functional
    const char* testMessage = "Socket test";
    EXPECT_TRUE(sender.send(testMessage, strlen(testMessage)));
}

TEST_F(TestUdpReplayer, MultipleInstancesIndependent) {
    // Test that multiple senders on different ports work independently
    UdpMulticastMessageSender sender1(testAddress, testPort, testTtl);
    UdpMulticastMessageSender sender2(testAddress, testPort + 1, testTtl);
    
    // Send different numbers of messages to each
    sender1.send("Message 1", 9);
    sender1.send("Message 2", 9);
    
    sender2.send("Other message", 13);
    
    EXPECT_EQ(sender1.getMessagesSent(), 2);
    EXPECT_EQ(sender2.getMessagesSent(), 1);
    EXPECT_NE(sender1.fd(), sender2.fd()); // Should have different sockets
}

TEST_F(TestUdpReplayer, InvalidAddressHandling) {
    // Test with invalid address - constructor should still work
    // (actual sending might fail, but object creation should succeed)
    EXPECT_NO_THROW({
        UdpMulticastMessageSender sender("999.999.999.999", testPort, testTtl);
        // Constructor should handle invalid addresses gracefully
    });
}