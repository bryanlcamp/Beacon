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
  
  // Parse required Global section
  if (!j.contains("Global")) {
    throw std::runtime_error("Missing required 'Global' section in configuration file.");
  }
  _globalConfig = parseGlobal(j["Global"]);
  
  // Parse optional Wave section (use defaults if missing)
  if (j.contains("Wave")) {
    _globalConfig.GlobalWaveConfig = parseWaveConfig(j["Wave"]);
  }
  
  // Parse optional Burst section (use defaults if missing)
  if (j.contains("Burst")) {
    _globalConfig.GlobalBurstConfig = parseBurstConfig(j["Burst"]);
  }
  
  // Parse required Symbols section
  if (!j.contains("Symbols")) {
    throw std::runtime_error("Missing required 'Symbols' section in configuration file.");
  }
  if (j["Symbols"].empty()) {
    throw std::runtime_error("'Symbols' section cannot be empty. At least one symbol must be defined.");
  }
  for (const auto& item : j["Symbols"]) {
    _symbols.push_back(parseSymbol(item));
  }
}

ConfigFileParser::PriceRange ConfigFileParser::parsePriceRange(const json& j) {
  PriceRange pr;
  pr.MinPrice = j.value("MinPrice", 0.0);
  pr.MaxPrice = j.value("MaxPrice", 0.0);
  pr.Weight = j.value("Weight", 1.0);
  return pr;
}

ConfigFileParser::QuantityRange ConfigFileParser::parseQuantityRange(const json& j) {
  QuantityRange qr;
  qr.MinQuantity = j.value("MinQuantity", 0);
  qr.MaxQuantity = j.value("MaxQuantity", 0);
  qr.Weight = j.value("Weight", 1.0);
  return qr;
}

ConfigFileParser::PreviousDay ConfigFileParser::parsePreviousDay(const json& j) {
  PreviousDay pd;
  pd.OpenPrice = j.value("OpenPrice", 0.0);
  pd.HighPrice = j.value("HighPrice", 0.0);
  pd.LowPrice = j.value("LowPrice", 0.0);
  pd.ClosePrice = j.value("ClosePrice", 0.0);
  pd.Volume = j.value("Volume", 0);
  return pd;
}

ConfigFileParser::SymbolConfig ConfigFileParser::parseSymbol(const json& j) {
  std::string symbolName = j.value("SymbolName", "");
  double percentTotalMessages = j.value("PercentTotalMessages", 0.0);
  double spreadPercentage = j.value("SpreadPercentage", 0.0);
  PriceRange priceRange;
  QuantityRange quantityRange;
  PreviousDay previousDay;
  if (j.contains("PriceRange")) priceRange = parsePriceRange(j["PriceRange"]);
  if (j.contains("QuantityRange")) quantityRange = parseQuantityRange(j["QuantityRange"]);
  if (j.contains("PrevDay")) previousDay = parsePreviousDay(j["PrevDay"]);
  return SymbolConfig(symbolName, percentTotalMessages, spreadPercentage, priceRange, quantityRange, previousDay);
}

ConfigFileParser::GlobalConfig ConfigFileParser::parseGlobal(const json& j) {
  GlobalConfig gc;
  gc.NumMessages = j.value("NumMessages", 0);
  gc.Exchange = j.value("Exchange", "");
  
  // Optional fields with reasonable defaults
  gc.TradeProbability = j.value("TradeProbability", 0.1); // Default 10% trades
  gc.FlushInterval = j.value("FlushInterval", 1000);       // Default flush every 1000 messages
  gc.SpreadPercentage = j.value("SpreadPercentage", 0.5);  // Default 0.5% spread
  
  // Coordination settings with defaults
  gc.BurstTogether = j.value("BurstTogether", false);
  gc.WaveTogether = j.value("WaveTogether", true);
  
  return gc;
}

ConfigFileParser::WaveConfig ConfigFileParser::parseWaveConfig(const json& j) {
  WaveConfig wc;
  wc.WaveDurationMs = j.value("WaveDurationMs", 300000);          // Default 5 minutes
  wc.WaveAmplitudePercent = j.value("WaveAmplitudePercent", 100.0); // Default 100% (flat)
  return wc;
}

ConfigFileParser::BurstConfig ConfigFileParser::parseBurstConfig(const json& j) {
  BurstConfig bc;
  bc.Enabled = j.value("Enabled", false);                          // Default disabled
  bc.BurstIntensityPercent = j.value("BurstIntensityPercent", 300.0); // Default 3x intensity
  bc.BurstFrequencyMs = j.value("BurstFrequencyMs", 60000);        // Default 1 minute between bursts
  return bc;
}

} // namespace market_data_generator
