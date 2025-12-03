/*
 * =============================================================================
 * Project:   Beacon
 * Application: client_algorithm
 * Purpose:   Configuration management header for trading algorithm
 * Author:    Bryan Camp
 * =============================================================================
 */

#pragma once

// C++ standard library
#include <string>
#include <vector>
#include <unordered_map>
#include <cstdint>

// Third-party libraries
#include <nlohmann/json.hpp>

namespace beacon::client_algorithm {

// Market data configuration
struct MarketDataConfig {
    std::string host = "127.0.0.1";
    uint16_t port = 12345;
};

// Exchange configuration  
struct ExchangeConfig {
    std::string host = "127.0.0.1";
    uint16_t port = 54321;
};

// Trading configuration
struct TradingConfig {
    uint32_t order_frequency = 100;  // Messages per second
    char default_time_in_force = '0';  // Day order
    char default_capacity = 'A';       // Agency
};

// Risk management configuration
struct RiskConfig {
    // PnL drawdown thresholds (negative values)
    double pnl_drawdown_warning = -10000.0;
    double pnl_drawdown_alert = -25000.0;
    double pnl_drawdown_hard_stop = -50000.0;
    
    // Order reject thresholds (positive counts)
    uint32_t order_reject_warning = 10;
    uint32_t order_reject_alert = 25;
    uint32_t order_reject_hard_stop = 50;
    
    // Order messaging burst thresholds (orders per second)
    uint32_t order_messaging_burst_warning = 100;
    uint32_t order_messaging_burst_alert = 200;
    uint32_t order_messaging_burst_hard_stop = 500;
    
    bool validatePnL() const {
        return pnl_drawdown_warning >= pnl_drawdown_alert && 
               pnl_drawdown_alert >= pnl_drawdown_hard_stop;
    }
    
    bool validateRejects() const {
        return order_reject_warning <= order_reject_alert && 
               order_reject_alert <= order_reject_hard_stop;
    }
};

// Product-specific configuration
struct ProductConfig {
    std::string symbol;
    int32_t starting_position = 0;
    uint32_t algo_position_limit = 1000;
    uint32_t firm_position_limit = 1000;
    bool enabled = true;
    int32_t current_position = 0;  // Runtime tracking
};

// Main configuration provider class
class ConfigProvider {
private:
    MarketDataConfig market_data_config_;
    ExchangeConfig exchange_config_;
    TradingConfig trading_config_;
    RiskConfig risk_config_;
    std::vector<ProductConfig> products_;
    std::unordered_map<std::string, size_t> symbol_index_map_;
    
    // Private parsing methods
    bool parseMarketDataConfig(const nlohmann::json& j);
    bool parseExchangeConfig(const nlohmann::json& j);
    bool parseTradingConfig(const nlohmann::json& j);
    bool parseRiskManagementConfig(const nlohmann::json& j);
    bool parseProducts(const nlohmann::json& j);
    
    void buildSymbolIndex();
    void printConfigSummary() const;
    void printRiskSummary() const;
    void printRiskValidationWarning() const;
    void printRejectValidationWarning() const;
    
public:
    ConfigProvider() = default;
    ~ConfigProvider() = default;
    
    // Load configuration from file
    bool loadFromFile(const std::string& filepath);
    
    // Getters for configuration sections
    const MarketDataConfig& getMarketDataConfig() const { return market_data_config_; }
    const ExchangeConfig& getExchangeConfig() const { return exchange_config_; }
    const TradingConfig& getTradingConfig() const { return trading_config_; }
    const RiskConfig& getRiskConfig() const { return risk_config_; }
    
    // Product-related methods
    const ProductConfig* getProductConfig(const std::string& symbol) const;
    std::vector<ProductConfig> getEnabledProducts() const;
    bool isSymbolEnabled(const std::string& symbol) const;
    size_t getEnabledProductCount() const;
    size_t getProductCount() const { return products_.size(); }
};

} // namespace beacon::client_algorithm
