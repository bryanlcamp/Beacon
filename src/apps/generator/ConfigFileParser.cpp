#include "ConfigFileParser.h"
#include <nlohmann/json.hpp>
#include <fstream>
#include <stdexcept>

using json = nlohmann::json;

namespace MarketDataGenerator {

ConfigFileParser::ConfigFileParser(const std::string& configFile) {
  parse(configFile);
  validate();
}

void ConfigFileParser::parse(const std::string& filename) {
  std::ifstream file(filename);
  if (!file.is_open()) {
    throw std::runtime_error("Could not open config file: " + filename);
  }
  json j;
  file >> j;
  if (j.contains("global")) {
    _globalConfig = parseGlobal(j["global"]);
  }
  if (j.contains("symbols")) {
    for (const auto& item : j["symbols"]) {
      _symbols.push_back(parseSymbol(item));
    }
  }
}

ConfigFileParser::PriceRange ConfigFileParser::parsePriceRange(const json& j) {
  PriceRange pr;
  pr.min_price = j.value("min_price", 0.0);
  pr.max_price = j.value("max_price", 0.0);
  pr.weight = j.value("weight", 1.0);
  return pr;
}

ConfigFileParser::QuantityRange ConfigFileParser::parseQuantityRange(const json& j) {
  QuantityRange qr;
  qr.min_quantity = j.value("min_quantity", 0);
  qr.max_quantity = j.value("max_quantity", 0);
  qr.weight = j.value("weight", 1.0);
  return qr;
}

ConfigFileParser::PreviousDay ConfigFileParser::parsePreviousDay(const json& j) {
  PreviousDay pd;
  pd.open_price = j.value("open_price", 0.0);
  pd.high_price = j.value("high_price", 0.0);
  pd.low_price = j.value("low_price", 0.0);
  pd.close_price = j.value("close_price", 0.0);
  pd.volume = j.value("volume", 0);
  return pd;
}

ConfigFileParser::SymbolConfig ConfigFileParser::parseSymbol(const json& j) {
  std::string symbol = j.value("symbol", "");
  double percentTotalMessages = j.value("percent", 0.0);
  double spreadPercentage = j.value("spread_percentage", 0.0);
  PriceRange priceRange;
  QuantityRange quantityRange;
  PreviousDay previousDay;
  if (j.contains("price_range")) priceRange = parsePriceRange(j["price_range"]);
  if (j.contains("quantity_range")) quantityRange = parseQuantityRange(j["quantity_range"]);
  if (j.contains("prev_day")) previousDay = parsePreviousDay(j["prev_day"]);
  return SymbolConfig(symbol, percentTotalMessages, spreadPercentage, priceRange, quantityRange, previousDay);
}

ConfigFileParser::GlobalConfig ConfigFileParser::parseGlobal(const json& j) {
  GlobalConfig gc;
  gc.num_messages = j.value("num_messages", 0);
  gc.exchange = j.value("exchange", "");
  gc.trade_probability = j.value("trade_probability", 0.0);
  gc.flush_interval = j.value("flush_interval", 0);
  gc.spread_percentage = j.value("spread_percentage", 0.0);
  return gc;
}

} // namespace MarketDataGenerator
