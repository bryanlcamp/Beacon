#pragma once

#include <string>
#include <vector>
#include <stdexcept>
#include <nlohmann/json.hpp>

namespace MarketDataGenerator {
  class ConfigFileParser {
    public:
      /// @brief Main parser API
      ConfigFileParser(const std::string& configFile);
      const std::vector<SymbolConfig>& getSymbols() const { return _symbols; }
      const GlobalConfig& getGlobalConfig() const { return _globalConfig; }

    private:
      /// @brief Private data members.
      std::vector<SymbolConfig> _symbols;
      GlobalConfig _globalConfig;

      /// @brief Private helper functions.
      void validate() const {
        if (!_globalConfig.validate()) throw std::runtime_error("Invalid global config");
        if (_symbols.empty()) throw std::runtime_error("No symbols defined in config");
        for (const auto& s : _symbols) {
          if (!s.validate()) throw std::runtime_error("Invalid symbol config: " + s._symbol);
        }
      }

      void parse(const std::string& filename);
      static PriceRange parsePriceRange(const nlohmann::json& j);
      static QuantityRange parseQuantityRange(const nlohmann::json& j);
      static PreviousDay parsePreviousDay(const nlohmann::json& j);
      static SymbolConfig parseSymbol(const nlohmann::json& j);
      static GlobalConfig parseGlobal(const nlohmann::json& j);

    /// @brief Public nested classes/structs.
    /// @remark All nested classes are per symbol.    
    public:
      class GlobalConfig {
        public:
          GlobalConfig() = default;
          int num_messages = 0;
          std::string exchange;
          double trade_probability = 0.0;
          int flush_interval = 0;
          double spread_percentage = 0.0;
          bool validate() const {
            return num_messages > 0 && !exchange.empty() &&
                trade_probability >= 0.0 && trade_probability <= 1.0 &&
                flush_interval >= 0 && spread_percentage >= 0.0;
          }
        }; // End class GlobalConfig

      /// @brief Per symbol in the .json config file.
      /// @remark There can, and likely will be, multiple symbols.
      class SymbolConfig {
        public:
          SymbolConfig(const std::string& symbol,
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
            _previousDay(previousDay) {
              validate();
            }

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
        }; // End SymbolConfig

        /// @brief Per Symbol
        struct PriceRange {
          double min_price;
          double max_price;
          double weight;
          bool validate() const {
            return min_price >= 0.0 && max_price >= min_price && weight > 0.0;
          }
        }; // End PriceRange

        /// @brief Per Symbol
        struct QuantityRange {
          int min_quantity;
          int max_quantity;
          double weight;
          bool validate() const {
            return min_quantity >= 0 && max_quantity >= min_quantity && weight > 0.0;
          }
        }; // End QuantityRange

        /// @brief Per Symbol
        struct PreviousDay {
          double open_price;
          double high_price;
          double low_price;
          double close_price;
          int volume;
          bool validate() const {
            return open_price >= 0.0 && high_price >= open_price && low_price >= 0.0 && close_price >= 0.0 && volume >= 0;
          }
        }; // End PreviousDay
      private: // End Nested Classes
    private: // End Extra Public Section
  }; // End class ConfigFileParser
} // namespace MarketDataGenerator
