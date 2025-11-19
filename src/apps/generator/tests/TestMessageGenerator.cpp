#include <gtest/gtest.h>
#include <fstream>
#include <filesystem>
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
  "Global": {
    "NumMessages": 100,
    "Exchange": "nsdq",
    "TradeProbability": 0.2,
    "FlushInterval": 50
  },
  "Wave": {
    "WaveDurationMs": 10000,
    "WaveAmplitudePercent": 120.0
  },
  "Burst": {
    "Enabled": true,
    "BurstIntensityPercent": 250.0,
    "BurstFrequencyMs": 5000
  },
  "Symbols": [
    {
      "SymbolName": "AAPL",
      "PercentTotalMessages": 60.0,
      "SpreadPercentage": 0.5,
      "PriceRange": {
        "MinPrice": 150.0,
        "MaxPrice": 200.0,
        "Weight": 1.0
      },
      "QuantityRange": {
        "MinQuantity": 10,
        "MaxQuantity": 500,
        "Weight": 1.0
      },
      "PrevDay": {
        "OpenPrice": 175.0,
        "HighPrice": 180.0,
        "LowPrice": 170.0,
        "ClosePrice": 178.0,
        "Volume": 50000
      }
    },
    {
      "SymbolName": "MSFT",
      "PercentTotalMessages": 40.0,
      "SpreadPercentage": 0.3,
      "PriceRange": {
        "MinPrice": 300.0,
        "MaxPrice": 350.0,
        "Weight": 1.0
      },
      "QuantityRange": {
        "MinQuantity": 5,
        "MaxQuantity": 200,
        "Weight": 1.0
      },
      "PrevDay": {
        "OpenPrice": 325.0,
        "HighPrice": 330.0,
        "LowPrice": 320.0,
        "ClosePrice": 328.0,
        "Volume": 30000
      }
    }
  ]
})";
        config.close();
    }
};

TEST_F(TestMessageGenerator, ConstructsWithValidConfig) {
    ConfigProvider configProvider("", "test_output.bin");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    EXPECT_EQ(generator.getMessageCount(), 100);
}

TEST_F(TestMessageGenerator, GeneratesBinaryOutput) {
    ConfigProvider configProvider("", "test_output.bin");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Generate messages - should not throw
    EXPECT_NO_THROW(generator.generateMessages("test_output.bin", 100, "test_generator_config.json"));
    
    // Verify output file was created
    EXPECT_TRUE(std::filesystem::exists("test_output.bin"));
    EXPECT_GT(std::filesystem::file_size("test_output.bin"), 0);
}

TEST_F(TestMessageGenerator, GeneratesCsvOutput) {
    ConfigProvider configProvider("", "test_output.csv");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    configProvider.setCsvMode(true);
    
    MessageGenerator generator(configProvider);
    
    // Generate CSV messages - should not throw
    EXPECT_NO_THROW(generator.generateMessages("test_output.csv", 100, "test_generator_config.json"));
    
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
    ConfigProvider configProvider("", "test_output.bin");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Test wave amplitude calculation at different points
    // Note: We can't directly test private methods, but we can test the behavior
    // by checking that generation completes successfully with wave configuration
    EXPECT_NO_THROW(generator.generateMessages("test_output.bin", 50, "test_generator_config.json"));
}

TEST_F(TestMessageGenerator, BurstGeneration) {
    ConfigProvider configProvider("", "test_output.bin");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Generate with burst enabled - should complete successfully
    EXPECT_NO_THROW(generator.generateMessages("test_output.bin", 100, "test_generator_config.json"));
    
    // Verify file was created and has content
    EXPECT_TRUE(std::filesystem::exists("test_output.bin"));
    EXPECT_GT(std::filesystem::file_size("test_output.bin"), 0);
}

TEST_F(TestMessageGenerator, MessageCountValidation) {
    ConfigProvider configProvider("", "test_output.bin");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    
    MessageGenerator generator(configProvider);
    
    // Test with zero messages - should handle gracefully
    EXPECT_NO_THROW(generator.generateMessages("test_output.bin", 0, "test_generator_config.json"));
    
    // Test with large number of messages
    EXPECT_NO_THROW(generator.generateMessages("test_output.bin", 10000, "test_generator_config.json"));
}

TEST_F(TestMessageGenerator, SymbolDistribution) {
    ConfigProvider configProvider("", "test_output.csv");
    ASSERT_TRUE(configProvider.loadConfig("test_generator_config.json"));
    configProvider.setCsvMode(true);
    
    MessageGenerator generator(configProvider);
    generator.generateMessages("test_output.csv", 100, "test_generator_config.json");
    
    // Read CSV and verify symbol distribution
    std::ifstream csvFile("test_output.csv");
    std::string line;
    std::getline(csvFile, line); // Skip header
    
    int aaplCount = 0, msftCount = 0;
    while (std::getline(csvFile, line)) {
        if (line.find("AAPL") != std::string::npos) aaplCount++;
        if (line.find("MSFT") != std::string::npos) msftCount++;
    }
    
    // Should have roughly 60% AAPL and 40% MSFT (within reasonable tolerance)
    EXPECT_GT(aaplCount, 0);
    EXPECT_GT(msftCount, 0);
    EXPECT_GT(aaplCount, msftCount); // AAPL should have more messages
}