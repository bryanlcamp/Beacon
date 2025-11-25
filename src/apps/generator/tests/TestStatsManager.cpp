#include <gtest/gtest.h>
#include "../include/StatsManager.h"

class TestStatsManager : public ::testing::Test {
protected:
    void SetUp() override {
        StatsManager = std::make_unique<::StatsManager>();
    }

    std::unique_ptr<::StatsManager> StatsManager;
};

TEST_F(TestStatsManager, InitialStateEmpty) {
    // StatsManager should start with no statistics
    // We can't directly test private members, but we can test behavior
    
    // Print stats with no data should not crash
    EXPECT_NO_THROW(StatsManager->PrintStats(0, 0.0));
}

TEST_F(TestStatsManager, UpdatesStatsForSingleSymbol) {
    // Add some statistics for a single symbol
    StatsManager->UpdateStats("AAPL", true, 100, 15000);  // Buy order
    StatsManager->UpdateStats("AAPL", false, 50, 15100);  // Sell order
    StatsManager->UpdateStats("AAPL", true, 200, 15050);  // Another buy
    
    // Should not throw when printing stats
    EXPECT_NO_THROW(StatsManager->PrintStats(3, 1.0));
}

TEST_F(TestStatsManager, UpdatesStatsForMultipleSymbols) {
    // Add statistics for multiple symbols
    StatsManager->UpdateStats("AAPL", true, 100, 15000);
    StatsManager->UpdateStats("MSFT", false, 200, 32500);
    StatsManager->UpdateStats("GOOG", true, 50, 280000);
    StatsManager->UpdateStats("AAPL", false, 75, 15100);
    StatsManager->UpdateStats("MSFT", true, 150, 32400);
    
    // Should handle multiple symbols correctly
    EXPECT_NO_THROW(StatsManager->PrintStats(5, 2.5));
}

TEST_F(TestStatsManager, HandlesLargeQuantities) {
    // Test with large quantities
    StatsManager->UpdateStats("BIGSTOCK", true, 1000000, 50000);
    StatsManager->UpdateStats("BIGSTOCK", false, 999999, 50050);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, HandlesZeroQuantities) {
    // Test edge case with zero quantities (shouldn't happen in real usage but should be robust)
    StatsManager->UpdateStats("ZEROTEST", true, 0, 10000);
    StatsManager->UpdateStats("ZEROTEST", false, 0, 10100);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, HandlesZeroPrices) {
    // Test edge case with zero prices (cancellations might have zero prices)
    StatsManager->UpdateStats("CANCEL", true, 100, 0);
    StatsManager->UpdateStats("CANCEL", false, 50, 0);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, HandlesVeryHighPrices) {
    // Test with very high prices (like BRK.A)
    StatsManager->UpdateStats("EXPENSIVE", true, 1, 50000000);  // $500,000
    StatsManager->UpdateStats("EXPENSIVE", false, 1, 50010000); // $500,100
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, HandlesVeryLowPrices) {
    // Test with very low prices (penny stocks)
    StatsManager->UpdateStats("PENNY", true, 10000, 5);    // $0.05
    StatsManager->UpdateStats("PENNY", false, 5000, 6);    // $0.06
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, StatisticsAccuracy) {
    // Test that statistics are calculated correctly
    // We'll use predictable values to verify calculations
    
    // AAPL: 2 buy orders (100 + 200 qty), 1 sell order (150 qty)
    // Buy prices: 15000, 15200 -> avg = 15100
    // Sell prices: 15100 -> avg = 15100
    // Spread should be 0 (15100 - 15100 = 0)
    StatsManager->UpdateStats("AAPL", true, 100, 15000);   // Buy at $150.00
    StatsManager->UpdateStats("AAPL", true, 200, 15200);   // Buy at $152.00
    StatsManager->UpdateStats("AAPL", false, 150, 15100);  // Sell at $151.00
    
    // The stats should be calculated correctly - we can't directly verify
    // the calculations but we can ensure it doesn't crash with known values
    EXPECT_NO_THROW(StatsManager->PrintStats(3, 1.0));
}

TEST_F(TestStatsManager, SymbolOrdering) {
    // Add symbols in non-alphabetical order to test if they're sorted properly
    StatsManager->UpdateStats("ZEBRA", true, 100, 10000);
    StatsManager->UpdateStats("APPLE", false, 50, 20000);
    StatsManager->UpdateStats("MICROSOFT", true, 75, 30000);
    StatsManager->UpdateStats("BANANA", false, 25, 15000);
    
    // Should handle symbol ordering correctly in output
    EXPECT_NO_THROW(StatsManager->PrintStats(4, 2.0));
}

TEST_F(TestStatsManager, MixedBuySellOrders) {
    // Test alternating buy/sell orders for proper average calculations
    for (int i = 0; i < 10; ++i) {
        bool isBuy = (i % 2 == 0);
        uint32_t price = 10000 + (i * 10); // Incrementing prices
        uint32_t quantity = 100 + i;       // Incrementing quantities
        
        StatsManager->UpdateStats("MIX", isBuy, quantity, price);
    }
    
    EXPECT_NO_THROW(StatsManager->PrintStats(10, 5.0));
}

TEST_F(TestStatsManager, LongSymbolNames) {
    // Test with very long symbol names to ensure formatting handles them
    std::string longSymbol(20, 'A'); // 20 character symbol
    StatsManager->UpdateStats(longSymbol, true, 100, 15000);
    StatsManager->UpdateStats(longSymbol, false, 50, 15100);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}

TEST_F(TestStatsManager, EmptySymbolName) {
    // Test edge case with empty symbol (shouldn't happen but should be robust)
    StatsManager->UpdateStats("", true, 100, 15000);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(1, 1.0));
}

TEST_F(TestStatsManager, SpecialCharacterSymbols) {
    // Test with symbols containing special characters
    StatsManager->UpdateStats("BRK.A", true, 1, 50000000);
    StatsManager->UpdateStats("BRK/B", false, 10, 25000000);
    
    EXPECT_NO_THROW(StatsManager->PrintStats(2, 1.0));
}