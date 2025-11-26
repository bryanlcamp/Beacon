#include <gtest/gtest.h>
#include <fstream>
#include <filesystem>
#include "../include/ConfigProvider.h"

using namespace beacon::market_data_generator::config;

class TestConfigProvider : public ::testing::Test {
protected:
    void SetUp() override {
        // Create test config files
        CreateTestConfigFiles();
    }

    void TearDown() override {
        // Clean up test files
        std::filesystem::remove("TestValidConfig.json");
        std::filesystem::remove("TestMalformedConfig.json");
        std::filesystem::remove("TestZeroMessagesConfig.json");
        std::filesystem::remove("TestInvalidExchangeConfig.json");
        std::filesystem::remove("TestMissingSymbolsConfig.json");
        std::filesystem::remove("TestInvalidPercentagesConfig.json");
    }

private:
    void CreateTestConfigFiles() {
        // Valid config
        std::ofstream validConfig("TestValidConfig.json");
        validConfig << R"({
  "exchange": "nasdaq",
  "message_count": 1000,
  "symbols": ["AAPL", "MSFT"],
  "trade_probability": 0.15,
  "flush_interval": 500
})";
        validConfig.close();

        // Malformed config
        std::ofstream malformedConfig("TestMalformedConfig.json");
        malformedConfig << "{ invalid json }";
        malformedConfig.close();

        // Zero messages config
        std::ofstream zeroConfig("TestZeroMessagesConfig.json");
        zeroConfig << R"({
  "exchange": "nasdaq",
  "message_count": 0,
  "symbols": [],
  "trade_probability": 0.15,
  "flush_interval": 1000
})";
        zeroConfig.close();

        // Invalid exchange config
        std::ofstream invalidExchange("TestInvalidExchangeConfig.json");
        invalidExchange << R"({
  "exchange": "InvalidExchange",
  "message_count": 1000,
  "symbols": ["AAPL"],
  "trade_probability": 0.15,
  "flush_interval": 1000
})";
        invalidExchange.close();

        // Missing symbols config
        std::ofstream missingSymbols("TestMissingSymbolsConfig.json");
        missingSymbols << R"({
  "exchange": "nasdaq",
  "message_count": 1000,
  "symbols": [],
  "trade_probability": 0.15,
  "flush_interval": 1000
})";
        missingSymbols.close();

        // Invalid symbols format config
        std::ofstream invalidSymbols("TestInvalidPercentagesConfig.json");
        invalidSymbols << R"({
  "exchange": "nasdaq",
  "message_count": 1000,
  "symbols": [123, "AAPL"],
  "trade_probability": 0.15,
  "flush_interval": 1000
})";
        invalidSymbols.close();
    }
};

TEST_F(TestConfigProvider, LoadsValidConfig) {
    ConfigProvider provider("Output.bin");
    EXPECT_TRUE(provider.LoadConfig("TestValidConfig.json"));
    EXPECT_EQ(provider.GetMessageCount(), 1000);
    EXPECT_FALSE(provider.GetSymbolsForGeneration().empty());
    EXPECT_EQ(provider.GetTradeProbability(), 0.15);
    EXPECT_EQ(provider.GetFlushInterval(), 500);
}

TEST_F(TestConfigProvider, FailsOnMissingFile) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("NonexistentConfig.json"));
}

TEST_F(TestConfigProvider, FailsOnMalformedConfig) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("TestMalformedConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesExchangeType) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("TestInvalidExchangeConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesNumMessages) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("TestZeroMessagesConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesSymbolsFormat) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("TestInvalidPercentagesConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesSymbolsNotEmpty) {
    ConfigProvider provider("Output.bin");
    EXPECT_FALSE(provider.LoadConfig("TestMissingSymbolsConfig.json"));
}

TEST_F(TestConfigProvider, CreatesCorrectSerializer) {
    ConfigProvider provider("Output.bin");
    EXPECT_TRUE(provider.LoadConfig("TestValidConfig.json"));

    auto serializer = provider.GetSerializer();
    EXPECT_NE(serializer, nullptr);
}

TEST_F(TestConfigProvider, CsvModeToggle) {
    ConfigProvider provider("Output.csv");
    EXPECT_TRUE(provider.LoadConfig("TestValidConfig.json"));
    
    // Test binary mode (default)
    auto binarySerializer = provider.GetSerializer();
    EXPECT_NE(binarySerializer, nullptr);
    
    // Test CSV mode
    provider.SetCsvMode(true);
    auto csvSerializer = provider.GetSerializer();
    EXPECT_NE(csvSerializer, nullptr);
}
