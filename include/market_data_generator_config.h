// Config file parser for market data generator
#pragma once
#include <string>
#include <vector>

namespace market_data_generator {

class ConfigFileParser {
public:
  ConfigFileParser(const std::string& configFile);

private:
  std::vector<SymbolConfig> _symbols;
  GlobalConfig _globalConfig;
  std::string _exchange;

public:
  class GlobalConfig {
    public:
      GlobalConfig(std::string configFilePath)
          : _configFilePath(configFilePath) {}

      bool validate() const {
        return _messagesToGenerate > 0 && !_exchange.empty();
      }

    private:
      int _messagesToGenerate = 0;
      std::string _exchange;
      std::string _configFilePath;
    };

  struct PriceRange {
      double min_price;
      double max_price;
      double weight;

      bool validate() const {
        return min_price >= 0.0 && max_price >= min_price && weight > 0.0;
      }
  };

  struct QuantityRange {
      int min_quantity;
      int max_quantity;
      double weight;

      bool validate() const {
        return min_quantity >= 0 && max_quantity >= min_quantity && weight > 0.0;
      }
  };

  struct PreviousDay {
      double open_price;
      double high_price;
      double low_price;
      double close_price;
      int volume;

      bool validate() const {
        return open_price >= 0.0 && high_price >= open_price && low_price >= 0.0 && close_price >= 0.0 && volume >= 0;
      }
  };

  class SymbolConfig {
    public:
      SymbolConfig(
        const std::string& symbol,
        double percentTotalMessages,
        double spreadPercentage,
        const PriceRange& priceRange,
        const QuantityRange& quantityRange,
        const PreviousDay& previousDay)
        : _symbol(symbol),
          _percentTotalMessages(percentTotalMessages),
          _spreadPercentage(spreadPercentage), 
          _priceRange(priceRange), 
          _quantityRange(quantityRange),
          _previousDay(previousDay) {}

      std::string _symbol;
      double _percentTotalMessages;
      double _spreadPercentage = 0.0;
      PriceRange _priceRange;
      QuantityRange _quantityRange;
      PreviousDay _previousDay;

      bool validate() const {
        return !_symbol.empty() &&
               _percentTotalMessages >= 0.0 && _percentTotalMessages <= 100.0 &&
               _spreadPercentage >= 0.0 &&
               _priceRange.validate() &&
               _quantityRange.validate() &&
               _previousDay.validate();
      }
  };  
private:
  // Validates the config. Throws std::runtime_error if invalid.
  void validate() const {
    if (!_globalConfig.validate()) throw std::runtime_error("Invalid global config");
    if (_symbols.empty()) throw std::runtime_error("No symbols defined in config");
    for (const auto& s : _symbols) {
      if (!s.validate()) throw std::runtime_error("Invalid symbol config: " + s._symbol);
    }
  }
};

} // namespace market_data_generator