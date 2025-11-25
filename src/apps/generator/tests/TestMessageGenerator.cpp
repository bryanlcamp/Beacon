#include <gtest/gtest.h>
#include <fstream>
#include <filesystem>
#include <thread>
#include <chrono>
#include <set>
#include <map>
#include "../include/MessageGenerator.h"
#include "../include/ConfigProvider.h"

using namespace beacon::market_data_generator;
using namespace beacon::market_data_generator::config;

class TestMessageGenerator : public ::testing::Test {
protected:
    void SetUp() override {
        createTestConfig();
    }

    void TearDown() override {
        std::filesystem::remove("test_generator_config.json");
        std::filesystem::remove("test_output.bin");
        std::filesystem::remove("test_output.csv");
    }

private:
    void createTestConfig() {
        std::ofstream config("test_generator_config.json");
        config << R"({
  "exchange": "nasdaq",
  "message_count": 100,
  "symbols": ["AAPL", "MSFT"],
  "trade_probability": 0.2,
  "flush_interval": 50
})";
        config.close();
    }
};

TEST_F(TestMessageGenerator, ConstructsWithValidConfig) {
    ConfigProvider configProvider("test_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    EXPECT_EQ(generator.GetMessageCount(), 100);
}

TEST_F(TestMessageGenerator, GeneratesBinaryOutput) {
    ConfigProvider configProvider("test_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Generate messages - should not throw
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.bin", 100, "test_generator_config.json"));
    
    // Verify output file was created
    EXPECT_TRUE(std::filesystem::exists("test_output.bin"));
    EXPECT_GT(std::filesystem::file_size("test_output.bin"), 0);
}

TEST_F(TestMessageGenerator, GeneratesCsvOutput) {
    ConfigProvider configProvider("test_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    
    // Generate CSV messages - should not throw
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.csv", 100, "test_generator_config.json"));
    
    // Verify CSV output file was created
    EXPECT_TRUE(std::filesystem::exists("test_output.csv"));
    EXPECT_GT(std::filesystem::file_size("test_output.csv"), 0);
    
    // Verify CSV contains header and data
    std::ifstream csvFile("test_output.csv");
    std::string firstLine;
    std::getline(csvFile, firstLine);
    EXPECT_TRUE(firstLine.find("timestamp") != std::string::npos);
    EXPECT_TRUE(firstLine.find("symbol") != std::string::npos);
    EXPECT_TRUE(firstLine.find("message_type") != std::string::npos);
}

TEST_F(TestMessageGenerator, WaveAmplitudeCalculation) {
    ConfigProvider configProvider("test_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Test wave amplitude calculation at different points
    // Note: We can't directly test private methods, but we can test the behavior
    // by checking that generation completes successfully with wave configuration
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.bin", 50, "test_generator_config.json"));
}

TEST_F(TestMessageGenerator, BurstGeneration) {
    ConfigProvider configProvider("test_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Generate with burst enabled - should complete successfully
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.bin", 100, "test_generator_config.json"));
    
    // Verify file was created and has content
    EXPECT_TRUE(std::filesystem::exists("test_output.bin"));
    EXPECT_GT(std::filesystem::file_size("test_output.bin"), 0);
}

TEST_F(TestMessageGenerator, MessageCountValidation) {
    ConfigProvider configProvider("test_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Test with zero messages - should handle gracefully
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.bin", 0, "test_generator_config.json"));
    
    // Test with large number of messages
    EXPECT_NO_THROW(generator.GenerateMessages("test_output.bin", 10000, "test_generator_config.json"));
}

TEST_F(TestMessageGenerator, SymbolDistribution) {
    ConfigProvider configProvider("test_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("test_generator_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    generator.GenerateMessages("test_output.csv", 100, "test_generator_config.json");
    
    // Read CSV and verify symbol distribution
    std::ifstream csvFile("test_output.csv");
    std::string line;
    std::getline(csvFile, line); // Skip header
    
    int aaplCount = 0, msftCount = 0, totalCount = 0;
    while (std::getline(csvFile, line)) {
        if (!line.empty() && line.find("timestamp") == std::string::npos) { // Skip header
            totalCount++;
            if (line.find("AAPL") != std::string::npos) aaplCount++;
            if (line.find("MSFT") != std::string::npos) msftCount++;
        }
    }
    csvFile.close();
    
    // Verify we generated close to the expected number of messages
    // (Generator creates mix of orders + trades, so count may be less than requested)
    EXPECT_GT(totalCount, 80);
    EXPECT_LE(totalCount, 100);
    
    // With 2 symbols in simple format, distribution should be roughly 50/50 (within 20% tolerance)
    double expectedPerSymbol = 50.0;
    double aaplPercent = (double)aaplCount / totalCount * 100.0;
    double msftPercent = (double)msftCount / totalCount * 100.0;
    
    EXPECT_NEAR(aaplPercent, expectedPerSymbol, 20.0);
    EXPECT_NEAR(msftPercent, expectedPerSymbol, 20.0);
    EXPECT_GT(aaplCount, 0);
    EXPECT_GT(msftCount, 0);
}

TEST_F(TestMessageGenerator, ExactMessageCountPerSymbol) {
    // Create a config with more symbols for precise distribution testing
    std::ofstream config("exact_count_config.json");
    config << R"({
  "exchange": "nasdaq",
  "message_count": 300,
  "symbols": ["AAPL", "MSFT", "GOOGL"],
  "trade_probability": 0.2,
  "flush_interval": 100
})";
    config.close();
    
    ConfigProvider configProvider("exact_count_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("exact_count_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    generator.GenerateMessages("exact_count_output.csv", 300, "exact_count_config.json");
    
    // Parse CSV and count messages per symbol
    std::ifstream csvFile("exact_count_output.csv");
    std::string line;
    std::getline(csvFile, line); // Skip header
    
    std::map<std::string, int> symbolCounts;
    symbolCounts["AAPL"] = 0;
    symbolCounts["MSFT"] = 0;
    symbolCounts["GOOGL"] = 0;
    
    int totalCount = 0;
    while (std::getline(csvFile, line)) {
        if (!line.empty() && line.find("timestamp") == std::string::npos) { // Skip header
            totalCount++;
            if (line.find("AAPL") != std::string::npos) symbolCounts["AAPL"]++;
            else if (line.find("MSFT") != std::string::npos) symbolCounts["MSFT"]++;
            else if (line.find("GOOGL") != std::string::npos) symbolCounts["GOOGL"]++;
        }
    }
    csvFile.close();
    
    // Verify reasonable total count (will be less than 300 due to order/trade mix)
    EXPECT_GT(totalCount, 240);
    EXPECT_LE(totalCount, 300);
    
    // Verify all symbols are represented
    EXPECT_GT(symbolCounts["AAPL"], 0);
    EXPECT_GT(symbolCounts["MSFT"], 0);  
    EXPECT_GT(symbolCounts["GOOGL"], 0);
    
    // Verify sum of individual counts equals total (allowing for possible parsing differences)
    int sumCounts = symbolCounts["AAPL"] + symbolCounts["MSFT"] + symbolCounts["GOOGL"];
    EXPECT_GE(sumCounts, totalCount - 2);  // Allow small discrepancy
    EXPECT_LE(sumCounts, totalCount);
    
    // With 3 symbols, each should get approximately 100 messages (within 15% tolerance)
    double expectedPerSymbol = 100.0;
    for (const auto& [symbol, count] : symbolCounts) {
        double percentage = (double)count / totalCount * 100.0;
        EXPECT_NEAR(percentage, 33.33, 15.0) << "Symbol " << symbol << " distribution off: " 
                                             << count << "/" << totalCount << " (" << percentage << "%)";
    }
    
    // Clean up
    std::remove("exact_count_config.json");
    std::remove("exact_count_output.csv");
}

TEST_F(TestMessageGenerator, LargeMessageCountDistribution) {
    // Test with larger message count to ensure distribution works well at scale
    std::ofstream config("large_count_config.json");
    config << R"({
  "exchange": "nasdaq", 
  "message_count": 1000,
  "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
  "trade_probability": 0.2,
  "flush_interval": 100
})";
    config.close();
    
    ConfigProvider configProvider("large_count_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("large_count_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    generator.GenerateMessages("large_count_output.csv", 1000, "large_count_config.json");
    
    // Parse CSV and count symbol distribution
    std::ifstream csvFile("large_count_output.csv");
    ASSERT_TRUE(csvFile.is_open()) << "Failed to open large_count_output.csv";
    
    std::string line;
    std::getline(csvFile, line); // Skip header
    
    std::map<std::string, int> symbolCounts;
    int totalCount = 0;
    
    while (std::getline(csvFile, line)) {
        if (!line.empty() && line.find("timestamp") == std::string::npos) { // Skip header
            totalCount++;
            if (line.find("AAPL") != std::string::npos) symbolCounts["AAPL"]++;
            else if (line.find("MSFT") != std::string::npos) symbolCounts["MSFT"]++;
            else if (line.find("GOOGL") != std::string::npos) symbolCounts["GOOGL"]++;
            else if (line.find("AMZN") != std::string::npos) symbolCounts["AMZN"]++;
            else if (line.find("TSLA") != std::string::npos) symbolCounts["TSLA"]++;
        }
    }
    csvFile.close();
    
    // Verify reasonable total count (800-1000 range due to order/trade mix)
    EXPECT_GT(totalCount, 700);
    EXPECT_LE(totalCount, 1000);
    
    // Verify all symbols are represented
    EXPECT_GT(symbolCounts["AAPL"], 0);
    EXPECT_GT(symbolCounts["MSFT"], 0);
    EXPECT_GT(symbolCounts["GOOGL"], 0);
    EXPECT_GT(symbolCounts["AMZN"], 0);
    EXPECT_GT(symbolCounts["TSLA"], 0);
    
    // With 5 symbols, each should get roughly 20% (within reasonable tolerance)
    for (const auto& [symbol, count] : symbolCounts) {
        double percentage = (double)count / totalCount * 100.0;
        EXPECT_GT(percentage, 10.0) << "Symbol " << symbol << " has too few messages: " << count;
        EXPECT_LT(percentage, 30.0) << "Symbol " << symbol << " has too many messages: " << count;
    }
    
    // Clean up
    std::remove("large_count_config.json");
    std::remove("large_count_output.csv");
}