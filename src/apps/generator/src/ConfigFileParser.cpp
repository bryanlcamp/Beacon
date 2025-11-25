#include <fstream>
#include <iostream>
#include <stdexcept>

#include <nlohmann/json.hpp>

#include "../include/ConfigFileParser.h"

using json = nlohmann::json;

namespace market_data_generator {

ConfigFileParser::ConfigFileParser(const std::string& configFile) {
  parse(configFile);
  validate();
}

void ConfigFileParser::parse(const std::string& filename) {
  std::ifstream file(filename);
  if (!file.is_open()) {
    throw std::runtime_error("Could not open configuration file: " + filename + ". Please check the file path and permissions.");
  }
  
  json j;
  try {
    file >> j;
  } catch (const nlohmann::json::parse_error& e) {
    throw std::runtime_error("JSON parsing error in " + filename + ": " + e.what());
  }
  
  // Parse simple format only
  parseSimpleFormat(j);
}















void ConfigFileParser::parseSimpleFormat(const nlohmann::json& j) {
  
  // Parse Global settings from simple format
  _globalConfig.Exchange = j.value("exchange", "nasdaq");
  _globalConfig.NumMessages = j.value("message_count", 10000);
  _globalConfig.TradeProbability = j.value("trade_probability", 0.15);
  _globalConfig.FlushInterval = j.value("flush_interval", 1000);
  
  // Parse symbols from simple array format
  auto symbols_array = j["symbols"];
  if (!symbols_array.is_array()) {
    throw std::runtime_error("'symbols' must be an array in simple format");
  }
  
  _symbols.clear();
  double percent_per_symbol = 100.0 / symbols_array.size();
  
  for (const auto& symbol_name : symbols_array) {
    if (!symbol_name.is_string()) {
      throw std::runtime_error("All symbols must be strings");
    }
    
    // Create default symbol configuration
    PriceRange defaultPriceRange{100.0, 200.0, 1.0};
    QuantityRange defaultQuantityRange{1, 100, 1.0};
    PreviousDay defaultPrevDay{150.0, 155.0, 145.0, 152.0, 1000000};
    
    SymbolConfig symbolConfig(
      symbol_name.get<std::string>(),
      percent_per_symbol,
      0.5, // Default 0.5% spread
      defaultPriceRange,
      defaultQuantityRange,
      defaultPrevDay
    );
    
    _symbols.push_back(symbolConfig);
  }
}

} // namespace market_data_generator
