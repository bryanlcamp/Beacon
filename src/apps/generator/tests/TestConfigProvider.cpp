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
  "Global": {
    "NumMessages": 1000,
    "Exchange": "nsdq",
    "TradeProbability": 0.15,
    "FlushInterval": 500
  },
  "Wave": {
    "WaveDurationMs": 60000,
    "WaveAmplitudePercent": 150.0
  },
  "Burst": {
    "Enabled": true,
    "BurstIntensityPercent": 200.0,
    "BurstFrequencyMs": 30000
  },
  "Symbols": [
    {
      "SymbolName": "TEST",
      "PercentTotalMessages": 100.0,
      "SpreadPercentage": 0.5,
      "PriceRange": {
        "MinPrice": 100.0,
        "MaxPrice": 200.0,
        "Weight": 1.0
      },
      "QuantityRange": {
        "MinQuantity": 1,
        "MaxQuantity": 100,
        "Weight": 1.0
      },
      "PrevDay": {
        "OpenPrice": 150.0,
        "HighPrice": 160.0,
        "LowPrice": 140.0,
        "ClosePrice": 155.0,
        "Volume": 10000
      }
    }
  ]
})";
        validConfig.close();

        // Malformed config
        std::ofstream malformedConfig("TestMalformedConfig.json");
        malformedConfig << "{ invalid json }";
        malformedConfig.close();

        // Zero messages config
        std::ofstream zeroConfig("TestZeroMessagesConfig.json");
        zeroConfig << R"({
  "Global": {
    "NumMessages": 0,
    "Exchange": "nsdq"
  },
  "Wave": {
    "WaveDurationMs": 60000,
    "WaveAmplitudePercent": 100.0
  },
  "Burst": {
    "Enabled": false
  },
  "Symbols": []
})";
        zeroConfig.close();

        // Invalid exchange config
        std::ofstream invalidExchange("TestInvalidExchangeConfig.json");
        invalidExchange << R"({
  "Global": {
    "NumMessages": 1000,
    "Exchange": "InvalidExchange"
  },
  "Wave": {
    "WaveDurationMs": 60000,
    "WaveAmplitudePercent": 100.0
  },
  "Burst": {
    "Enabled": false
  },
  "Symbols": []
})";
        invalidExchange.close();

        // Missing symbols config
        std::ofstream missingSymbols("TestMissingSymbolsConfig.json");
        missingSymbols << R"({
  "Global": {
    "NumMessages": 1000,
    "Exchange": "nsdq"
  },
  "Wave": {
    "WaveDurationMs": 60000,
    "WaveAmplitudePercent": 100.0
  },
  "Burst": {
    "Enabled": false
  },
  "Symbols": []
})";
        missingSymbols.close();

        // Invalid percentages config
        std::ofstream invalidPercentages("TestInvalidPercentagesConfig.json");
        invalidPercentages << R"({
  "Global": {
    "NumMessages": 1000,
    "Exchange": "nsdq"
  },
  "Wave": {
    "WaveDurationMs": 60000,
    "WaveAmplitudePercent": 100.0
  },
  "Burst": {
    "Enabled": false
  },
  "Symbols": [
    {
      "SymbolName": "TEST1",
      "PercentTotalMessages": 60.0,
      "SpreadPercentage": 0.5,
      "PriceRange": {"MinPrice": 100.0, "MaxPrice": 200.0, "Weight": 1.0},
      "QuantityRange": {"MinQuantity": 1, "MaxQuantity": 100, "Weight": 1.0},
      "PrevDay": {"OpenPrice": 150.0, "HighPrice": 160.0, "LowPrice": 140.0, "ClosePrice": 155.0, "Volume": 10000}
    },
    {
      "SymbolName": "TEST2",
      "PercentTotalMessages": 50.0,
      "SpreadPercentage": 0.5,
      "PriceRange": {"MinPrice": 100.0, "MaxPrice": 200.0, "Weight": 1.0},
      "QuantityRange": {"MinQuantity": 1, "MaxQuantity": 100, "Weight": 1.0},
      "PrevDay": {"OpenPrice": 150.0, "HighPrice": 160.0, "LowPrice": 140.0, "ClosePrice": 155.0, "Volume": 10000}
    }
  ]
})";
        invalidPercentages.close();
    }
};

TEST_F(TestConfigProvider, LoadsValidConfig) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_TRUE(provider.loadConfig("TestValidConfig.json"));
    EXPECT_EQ(provider.getMessageCount(), 1000);
    EXPECT_FALSE(provider.getSymbolsForGeneration().empty());
    EXPECT_EQ(provider.getTradeProbability(), 0.15);
    EXPECT_EQ(provider.getFlushInterval(), 500);
}

TEST_F(TestConfigProvider, FailsOnMissingFile) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("NonexistentConfig.json"));
}

TEST_F(TestConfigProvider, FailsOnMalformedConfig) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("TestMalformedConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesExchangeType) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("TestInvalidExchangeConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesNumMessages) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("TestZeroMessagesConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesSymbolPercentages) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("TestInvalidPercentagesConfig.json"));
}

TEST_F(TestConfigProvider, ValidatesSymbolsNotEmpty) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_FALSE(provider.loadConfig("TestMissingSymbolsConfig.json"));
}

TEST_F(TestConfigProvider, CreatesCorrectSerializer) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_TRUE(provider.loadConfig("TestValidConfig.json"));
    
    auto serializer = provider.getSerializer();
    EXPECT_NE(serializer, nullptr);
}

TEST_F(TestConfigProvider, CsvModeToggle) {
    ConfigProvider provider("", "Output.csv");
    EXPECT_TRUE(provider.loadConfig("TestValidConfig.json"));
    
    // Test binary mode (default)
    auto binarySerializer = provider.getSerializer();
    EXPECT_NE(binarySerializer, nullptr);
    
    // Test CSV mode
    provider.setCsvMode(true);
    auto csvSerializer = provider.getSerializer();
    EXPECT_NE(csvSerializer, nullptr);
}

TEST_F(TestConfigProvider, WaveConfigurationLoaded) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_TRUE(provider.loadConfig("TestValidConfig.json"));
    
    const auto& waveConfig = provider.getWaveConfig();
    EXPECT_EQ(waveConfig.WaveDurationMs, 60000);
    EXPECT_EQ(waveConfig.WaveAmplitudePercent, 150.0);
}

TEST_F(TestConfigProvider, BurstConfigurationLoaded) {
    ConfigProvider provider("", "Output.bin");
    EXPECT_TRUE(provider.loadConfig("TestValidConfig.json"));
    
    const auto& burstConfig = provider.getBurstConfig();
    EXPECT_TRUE(burstConfig.Enabled);
    EXPECT_EQ(burstConfig.BurstIntensityPercent, 200.0);
    EXPECT_EQ(burstConfig.BurstFrequencyMs, 30000);
}
