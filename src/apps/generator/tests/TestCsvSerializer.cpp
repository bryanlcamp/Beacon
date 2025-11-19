#include <gtest/gtest.h>
#include <fstream>
#include <filesystem>
#include <sstream>
#include "../include/serializers/CsvSerializer.h"
#include "../include/Message.h"

using namespace beacon::market_data_generator;
using namespace beacon::market_data_generator::serializers;

class TestCsvSerializer : public ::testing::Test {
protected:
    void SetUp() override {
        TestFilePath = "TestCsvOutput.csv";
    }

    void TearDown() override {
        std::filesystem::remove(TestFilePath);
    }

    std::string TestFilePath;
};

TEST_F(TestCsvSerializer, CreatesFileWithHeader) {
    {
        // Create serializer in scope to ensure destructor is called
        CsvMarketDataSerializer serializer(TestFilePath);
        
        // Create and serialize a message to trigger header writing
        Message message("TEST", MessageType::Bid, "Buy", 100, 100.00, 1, 1000000000000000);
        serializer.serializeMessage(message);
    } // Destructor closes file here
    
    // Verify file was created and has header
    EXPECT_TRUE(std::filesystem::exists(TestFilePath));
    
    std::ifstream file(TestFilePath);
    std::string header;
    std::getline(file, header);
    
    // Use string comparison that doesn't trigger GoogleTest string printing issues
    const std::string expected = "timestamp,symbol,message_type,side,price,quantity,order_id,trade_id";
    EXPECT_TRUE(header == expected) << "Expected: " << expected << ", got: " << header;
}

TEST_F(TestCsvSerializer, SerializesBidMessage) {
    {
        CsvMarketDataSerializer serializer(TestFilePath);
        Message message("AAPL", MessageType::Bid, "Buy", 100, 150.25, 12345, 1234567890123456);
        serializer.serializeMessage(message);
    } // Ensure file is closed
    
    // Read the file and verify content
    std::ifstream file(TestFilePath);
    std::string header, dataLine;
    std::getline(file, header); // Skip header
    std::getline(file, dataLine);
    
    EXPECT_NE(dataLine.find("AAPL"), std::string::npos);
    EXPECT_NE(dataLine.find("Bid"), std::string::npos);
    EXPECT_NE(dataLine.find("Buy"), std::string::npos);
    EXPECT_NE(dataLine.find("150.25"), std::string::npos);
    EXPECT_NE(dataLine.find("100"), std::string::npos);
    EXPECT_NE(dataLine.find("12345"), std::string::npos);
}

TEST_F(TestCsvSerializer, SerializesTradeMessage) {
    {
        CsvMarketDataSerializer serializer(TestFilePath);
        Message message("MSFT", MessageType::Last, "Sell", 250, 325.00, 67890, 9876543210987654);
        serializer.serializeMessage(message);
    } // Ensure file is closed
    
    // Read and verify trade message
    std::ifstream file(TestFilePath);
    std::string header, dataLine;
    std::getline(file, header); // Skip header
    std::getline(file, dataLine);
    
    EXPECT_NE(dataLine.find("MSFT"), std::string::npos);
    EXPECT_NE(dataLine.find("Trade"), std::string::npos);
    EXPECT_NE(dataLine.find("Sell"), std::string::npos);
    EXPECT_NE(dataLine.find("325.00"), std::string::npos);
    EXPECT_NE(dataLine.find("250"), std::string::npos);
    EXPECT_NE(dataLine.find("67890"), std::string::npos);
}

TEST_F(TestCsvSerializer, SerializesAskMessage) {
    {
        CsvMarketDataSerializer serializer(TestFilePath);
        Message message("GOOG", MessageType::Ask, "Sell", 50, 2750.50, 11111, 1111222233334444);
        serializer.serializeMessage(message);
    } // Ensure file is closed
    
    // Read and verify ask message
    std::ifstream file(TestFilePath);
    std::string header, dataLine;
    std::getline(file, header); // Skip header
    std::getline(file, dataLine);
    
    EXPECT_NE(dataLine.find("GOOG"), std::string::npos);
    EXPECT_NE(dataLine.find("Ask"), std::string::npos);
    EXPECT_NE(dataLine.find("Sell"), std::string::npos);
    EXPECT_NE(dataLine.find("2750.50"), std::string::npos);
    EXPECT_NE(dataLine.find("50"), std::string::npos);
    EXPECT_NE(dataLine.find("11111"), std::string::npos);
}

TEST_F(TestCsvSerializer, HandlesMultipleMessages) {
    {
        CsvMarketDataSerializer serializer(TestFilePath);
        
        // Serialize multiple messages
        for (int i = 0; i < 5; ++i) {
        std::string symbol = "TEST" + std::to_string(i);
        MessageType messageType = (i % 3 == 0) ? MessageType::Bid : 
                                 (i % 3 == 1) ? MessageType::Ask : MessageType::Last;
        std::string type = (i % 2 == 0) ? "Buy" : "Sell";
        double price = 100.0 + (i * 1.0); // 100.00, 101.00, 102.00, etc.
        size_t quantity = 100 + (i * 10);
        uint64_t sequenceNumber = 1000 + i;
        uint64_t timestamp = 1000000000000000 + i;
        
            Message message(symbol, messageType, type, quantity, price, sequenceNumber, timestamp);
            serializer.serializeMessage(message);
        }
    } // Ensure file is closed
    
    // Count lines in file (header + 5 data lines = 6 total)
    std::ifstream file(TestFilePath);
    std::string line;
    int lineCount = 0;
    while (std::getline(file, line)) {
        lineCount++;
    }
    
    EXPECT_EQ(lineCount, 6); // Header + 5 messages
}

TEST_F(TestCsvSerializer, PriceFormatting) {
    {
        CsvMarketDataSerializer serializer(TestFilePath);
        // Test price formatting - CSV serializer uses fixed 2 decimal places
        Message message("PRICE_TEST", MessageType::Bid, "Buy", 100, 123.456, 1, 1000000000000000);
        serializer.serializeMessage(message);
    } // Ensure file is closed
    
    // Read and verify price formatting (should be rounded to 2 decimal places)
    std::ifstream file(TestFilePath);
    std::string header, dataLine;
    std::getline(file, header);
    std::getline(file, dataLine);
    
    EXPECT_NE(dataLine.find("123.46"), std::string::npos);
}

TEST_F(TestCsvSerializer, MessageTypeToString) {
    // Test different message types
    std::vector<std::pair<MessageType, std::string>> TypeTests = {
        {MessageType::Bid, "Bid"},
        {MessageType::Ask, "Ask"},
        {MessageType::Last, "Trade"}
    };
    
    for (const auto& [MsgType, ExpectedStr] : TypeTests) {
        std::filesystem::remove(TestFilePath);
        {
            CsvMarketDataSerializer serializer(TestFilePath);
            Message message("TYPE_TEST", MsgType, "Buy", 100, 100.00, 1, 1000000000000000);
            serializer.serializeMessage(message);
        } // Ensure file is closed
        
        // Read and verify message type
        std::ifstream file(TestFilePath);
        std::string header, dataLine;
        std::getline(file, header);
        std::getline(file, dataLine);
        
        EXPECT_NE(dataLine.find(ExpectedStr), std::string::npos)
            << "Expected message type not found in data line";
    }
}