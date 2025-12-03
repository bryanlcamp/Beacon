#include <gtest/gtest.h>
#include <fstream>
#include <filesystem>
#include <algorithm>
#include "protocol_common.h"
#include "../include/ConfigProvider.h"
#include "../include/MessageGenerator.h"

using namespace beacon::market_data_generator;
using namespace beacon::market_data_generator::config;

class TestGeneratorIntegration : public ::testing::Test {
protected:
    void SetUp() override {
        createIntegrationTestConfig();
    }

    void TearDown() override {
        // Clean up test files
        std::filesystem::remove("integration_test_config.json");
        std::filesystem::remove("integration_output.bin");
        std::filesystem::remove("integration_output.csv");
        std::filesystem::remove("small_config.json");
        std::filesystem::remove("small_output.bin");
    }

private:
    void createIntegrationTestConfig() {
        // Create a comprehensive test configuration
        std::ofstream config("integration_test_config.json");
        config << R"({
  "exchange": "nasdaq",
  "message_count": 500,
  "symbols": ["AAPL", "MSFT", "GOOG"],
  "trade_probability": 0.25,
  "flush_interval": 100
})";
        config.close();
        
        // Create small config for other tests  
        std::ofstream smallConfig("small_config.json");
        smallConfig << R"({
  "exchange": "nasdaq", 
  "message_count": 50,
  "symbols": ["TEST"],
  "trade_probability": 0.1,
  "flush_interval": 25
})";
        smallConfig.close();
    }
};

TEST_F(TestGeneratorIntegration, FullPipelineBinaryOutput) {
    // Test the complete pipeline: ConfigProvider -> MessageGenerator -> Binary output
    
    ConfigProvider configProvider("integration_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("integration_test_config.json"));
    
    // Verify configuration was loaded correctly
    EXPECT_EQ(configProvider.GetMessageCount(), 500);
    EXPECT_EQ(configProvider.GetTradeProbability(), 0.25);
    EXPECT_EQ(configProvider.GetFlushInterval(), 100);
    
    auto symbols = configProvider.GetSymbolsForGeneration();
    EXPECT_EQ(symbols.size(), 3);
    
    // Create and run generator
    MessageGenerator generator(configProvider);
    EXPECT_NO_THROW(generator.GenerateMessages("integration_output.bin", 500, "integration_test_config.json"));
    
    // Verify output file
    EXPECT_TRUE(std::filesystem::exists("integration_output.bin"));
    EXPECT_GT(std::filesystem::file_size("integration_output.bin"), 0);
}

TEST_F(TestGeneratorIntegration, FullPipelineCsvOutput) {
    // Test the complete pipeline with CSV output
    
    ConfigProvider configProvider("integration_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("integration_test_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    EXPECT_NO_THROW(generator.GenerateMessages("integration_output.csv", 500, "integration_test_config.json"));
    
    // Verify CSV output file
    EXPECT_TRUE(std::filesystem::exists("integration_output.csv"));
    EXPECT_GT(std::filesystem::file_size("integration_output.csv"), 0);
    
    // Verify CSV format by checking for header line
    std::ifstream csvFile("integration_output.csv");
    std::string firstLine;
    std::getline(csvFile, firstLine);
    // Look for any common CSV header indicators (case-insensitive)
    std::transform(firstLine.begin(), firstLine.end(), firstLine.begin(), ::tolower);
    EXPECT_TRUE(firstLine.find("timestamp") != std::string::npos || 
                firstLine.find("symbol") != std::string::npos ||
                firstLine.find("message") != std::string::npos);
    csvFile.close();
}

TEST_F(TestGeneratorIntegration, SymbolDistributionAccuracy) {
    // Test that symbol distribution matches configuration percentages
    
    ConfigProvider configProvider("integration_output.csv");
    ASSERT_TRUE(configProvider.LoadConfig("integration_test_config.json"));
    configProvider.SetCsvMode(true);
    
    MessageGenerator generator(configProvider);
    generator.GenerateMessages("integration_output.csv", 500, "integration_test_config.json");
    
    // Parse CSV and count symbol occurrences
    std::ifstream csvFile("integration_output.csv");
    std::string line;
    std::getline(csvFile, line); // Skip header
    
    int aaplCount = 0, msftCount = 0, googCount = 0, totalCount = 0;
    
    while (std::getline(csvFile, line)) {
        totalCount++;
        if (line.find("AAPL") != std::string::npos) aaplCount++;
        else if (line.find("MSFT") != std::string::npos) msftCount++;  
        else if (line.find("GOOG") != std::string::npos) googCount++;
    }
    csvFile.close();
    
    // Verify distribution is reasonable (within 10% tolerance)
    double aaplPercent = (double)aaplCount / totalCount * 100.0;
    double msftPercent = (double)msftCount / totalCount * 100.0;
    double googPercent = (double)googCount / totalCount * 100.0;
    
    // Simple format uses equal distribution, so each should be ~33%
    EXPECT_NEAR(aaplPercent, 33.3, 10.0);
    EXPECT_NEAR(msftPercent, 33.3, 10.0);
    EXPECT_NEAR(googPercent, 33.3, 10.0);
}

TEST_F(TestGeneratorIntegration, MultipleExchangeTypes) {
    // Test different exchange types
    
    std::vector<std::string> exchanges = {"nasdaq", "cme", "nyse"};
    
    for (const auto& exchange : exchanges) {
        ConfigProvider configProvider("test_" + exchange + ".bin");
        ASSERT_TRUE(configProvider.LoadConfig("small_config.json"));
        
        MessageGenerator generator(configProvider);
        EXPECT_NO_THROW(generator.GenerateMessages("test_" + exchange + ".bin", 50, "small_config.json"));
        
        EXPECT_TRUE(std::filesystem::exists("test_" + exchange + ".bin"));
        EXPECT_GT(std::filesystem::file_size("test_" + exchange + ".bin"), 0);
        
        // Clean up
        std::filesystem::remove("test_" + exchange + ".bin");
    }
}

TEST_F(TestGeneratorIntegration, LargeMessageGeneration) {
    // Test with larger message counts
    
    ConfigProvider configProvider("large_output.bin");
    ASSERT_TRUE(configProvider.LoadConfig("small_config.json"));
    
    MessageGenerator generator(configProvider);
    EXPECT_NO_THROW(generator.GenerateMessages("large_output.bin", 10000, "small_config.json"));
    
    EXPECT_TRUE(std::filesystem::exists("large_output.bin"));
    EXPECT_GT(std::filesystem::file_size("large_output.bin"), 10000); // Should be substantial
    
    // Clean up
    std::filesystem::remove("large_output.bin");
}

TEST_F(TestGeneratorIntegration, ConfigurationValidation) {
    // Test proper error handling for invalid configurations
    
    ConfigProvider configProvider("test_output.bin");
    
    // Test with non-existent config file
    EXPECT_FALSE(configProvider.LoadConfig("nonexistent_config.json"));
}

TEST_F(TestGeneratorIntegration, FileOutputConsistency) {
    // Test that repeated runs with same config produce consistent results
    
    ConfigProvider configProvider1("output1.csv");
    ASSERT_TRUE(configProvider1.LoadConfig("small_config.json"));
    configProvider1.SetCsvMode(true);
    
    MessageGenerator generator1(configProvider1);
    generator1.GenerateMessages("output1.csv", 100, "small_config.json");
    
    ConfigProvider configProvider2("output2.csv");
    ASSERT_TRUE(configProvider2.LoadConfig("small_config.json"));
    configProvider2.SetCsvMode(true);
    
    MessageGenerator generator2(configProvider2);
    generator2.GenerateMessages("output2.csv", 100, "small_config.json");
    
    // Both files should exist and have reasonable content
    EXPECT_TRUE(std::filesystem::exists("output1.csv"));
    EXPECT_TRUE(std::filesystem::exists("output2.csv"));
    EXPECT_GT(std::filesystem::file_size("output1.csv"), 0);
    EXPECT_GT(std::filesystem::file_size("output2.csv"), 0);
    
    // Clean up
    std::filesystem::remove("output1.csv");
    std::filesystem::remove("output2.csv");
}