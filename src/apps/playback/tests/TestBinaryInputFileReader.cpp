#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include "../BinaryInputFileReader.h"

class TestBinaryInputFileReader : public ::testing::Test {
protected:
    void SetUp() override {
        createTestBinaryFile();
    }

    void TearDown() override {
        // Clean up test files
        std::filesystem::remove("test_valid.bin");
        std::filesystem::remove("test_invalid_size.bin");
        std::filesystem::remove("test_empty.bin");
        std::filesystem::remove("test_corrupted.bin");
    }

private:
    void createTestBinaryFile() {
        // Create a valid test binary file (10 messages of 33 bytes each)
        std::ofstream validFile("test_valid.bin", std::ios::binary);
        for (int i = 0; i < 10; i++) {
            std::array<char, 33> message = {};
            // Fill with test pattern
            message[0] = 'A' + (i % 26); // Message type indicator
            message[1] = static_cast<char>(i); // Sequence number
            // Fill rest with predictable pattern
            for (size_t j = 2; j < 33; j++) {
                message[j] = static_cast<char>((i + j) % 256);
            }
            validFile.write(message.data(), 33);
        }
        validFile.close();

        // Create invalid size file (not multiple of 33)
        std::ofstream invalidFile("test_invalid_size.bin", std::ios::binary);
        char buffer[100] = {};
        invalidFile.write(buffer, 100); // 100 bytes, not multiple of 33
        invalidFile.close();

        // Create empty file
        std::ofstream emptyFile("test_empty.bin", std::ios::binary);
        emptyFile.close();

        // Create corrupted file (all zeros)
        std::ofstream corruptedFile("test_corrupted.bin", std::ios::binary);
        std::array<char, 33> zeroMessage = {};
        for (int i = 0; i < 5; i++) {
            corruptedFile.write(zeroMessage.data(), 33);
        }
        corruptedFile.close();
    }
};

TEST_F(TestBinaryInputFileReader, LoadValidFile) {
    BinaryInputFileReader reader;
    
    ASSERT_TRUE(reader.load("test_valid.bin"));
    EXPECT_EQ(reader.size(), 10);
    EXPECT_TRUE(reader.isLoaded());
    EXPECT_EQ(reader.getFilePath(), "test_valid.bin");
}

TEST_F(TestBinaryInputFileReader, LoadNonexistentFile) {
    BinaryInputFileReader reader;
    
    EXPECT_FALSE(reader.load("nonexistent_file.bin"));
    EXPECT_EQ(reader.size(), 0);
    EXPECT_FALSE(reader.isLoaded());
}

TEST_F(TestBinaryInputFileReader, LoadInvalidSizeFile) {
    BinaryInputFileReader reader;
    
    EXPECT_FALSE(reader.load("test_invalid_size.bin"));
    EXPECT_EQ(reader.size(), 0);
    EXPECT_FALSE(reader.isLoaded());
}

TEST_F(TestBinaryInputFileReader, LoadEmptyFile) {
    BinaryInputFileReader reader;
    
    EXPECT_FALSE(reader.load("test_empty.bin"));
    EXPECT_EQ(reader.size(), 0);
    EXPECT_FALSE(reader.isLoaded());
}

TEST_F(TestBinaryInputFileReader, GetMessageValid) {
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_valid.bin"));
    
    // Test first message
    const char* message = reader.getMessage(0);
    ASSERT_NE(message, nullptr);
    EXPECT_EQ(message[0], 'A'); // First message should start with 'A'
    EXPECT_EQ(message[1], 0);   // Sequence number should be 0
    
    // Test last message
    message = reader.getMessage(9);
    ASSERT_NE(message, nullptr);
    EXPECT_EQ(message[0], 'J'); // Tenth message should start with 'J' (A + 9)
    EXPECT_EQ(message[1], 9);   // Sequence number should be 9
}

TEST_F(TestBinaryInputFileReader, GetMessageOutOfBounds) {
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_valid.bin"));
    
    // Test out of bounds access
    EXPECT_EQ(reader.getMessage(10), nullptr);  // Index 10 is out of bounds (0-9 valid)
    EXPECT_EQ(reader.getMessage(100), nullptr); // Way out of bounds
}

TEST_F(TestBinaryInputFileReader, GetMessageFromUnloadedReader) {
    BinaryInputFileReader reader;
    
    // Reader not loaded, should return nullptr
    EXPECT_EQ(reader.getMessage(0), nullptr);
}

TEST_F(TestBinaryInputFileReader, MessageDataIntegrity) {
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_valid.bin"));
    
    // Verify all messages have correct patterns
    for (size_t i = 0; i < reader.size(); i++) {
        const char* message = reader.getMessage(i);
        ASSERT_NE(message, nullptr);
        
        // Check message type and sequence
        EXPECT_EQ(message[0], static_cast<char>('A' + (i % 26)));
        EXPECT_EQ(message[1], static_cast<char>(i));
        
        // Check pattern in rest of message
        for (size_t j = 2; j < BinaryInputFileReader::MESSAGE_SIZE; j++) {
            EXPECT_EQ(message[j], static_cast<char>((i + j) % 256));
        }
    }
}

TEST_F(TestBinaryInputFileReader, MultipleLoads) {
    BinaryInputFileReader reader;
    
    // Load first file
    ASSERT_TRUE(reader.load("test_valid.bin"));
    EXPECT_EQ(reader.size(), 10);
    
    // Load second file (should replace first)
    ASSERT_TRUE(reader.load("test_corrupted.bin"));
    EXPECT_EQ(reader.size(), 5);
    EXPECT_EQ(reader.getFilePath(), "test_corrupted.bin");
    
    // Verify data from second file
    const char* message = reader.getMessage(0);
    ASSERT_NE(message, nullptr);
    // All bytes should be zero in corrupted file
    for (size_t i = 0; i < BinaryInputFileReader::MESSAGE_SIZE; i++) {
        EXPECT_EQ(message[i], 0);
    }
}

TEST_F(TestBinaryInputFileReader, ConstexprMessageSize) {
    // Verify MESSAGE_SIZE is compile-time constant and correct value
    static_assert(BinaryInputFileReader::MESSAGE_SIZE == 33, "MESSAGE_SIZE should be 33 bytes");
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_valid.bin"));
    
    // Verify file size calculation
    auto fileSize = std::filesystem::file_size("test_valid.bin");
    EXPECT_EQ(fileSize, reader.size() * BinaryInputFileReader::MESSAGE_SIZE);
}

TEST_F(TestBinaryInputFileReader, LargeFileHandling) {
    // Create larger test file
    std::ofstream largeFile("test_large.bin", std::ios::binary);
    const size_t numMessages = 1000;
    
    for (size_t i = 0; i < numMessages; i++) {
        std::array<char, 33> message = {};
        message[0] = static_cast<char>(i % 256);
        message[1] = static_cast<char>((i >> 8) % 256);
        largeFile.write(message.data(), 33);
    }
    largeFile.close();
    
    BinaryInputFileReader reader;
    ASSERT_TRUE(reader.load("test_large.bin"));
    EXPECT_EQ(reader.size(), numMessages);
    
    // Verify first and last messages
    const char* firstMsg = reader.getMessage(0);
    const char* lastMsg = reader.getMessage(numMessages - 1);
    
    ASSERT_NE(firstMsg, nullptr);
    ASSERT_NE(lastMsg, nullptr);
    
    EXPECT_EQ(firstMsg[0], 0);
    EXPECT_EQ(firstMsg[1], 0);
    
    EXPECT_EQ(lastMsg[0], static_cast<char>((numMessages - 1) % 256));
    EXPECT_EQ(lastMsg[1], static_cast<char>(((numMessages - 1) >> 8) % 256));
    
    // Clean up
    std::filesystem::remove("test_large.bin");
}