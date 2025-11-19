/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      CSV serializer for human-readable market data output
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include "MarketDataSerializer.h"
#include <fstream>
#include <string>

namespace beacon::market_data_generator::serializers {

/// @brief CSV serializer for human-readable market data output
/// @details Outputs market data in CSV format with columns:
///          timestamp, symbol, message_type, side, price, quantity, order_id, trade_id
class CsvMarketDataSerializer : public IMarketDataSerializer {
  public:
    /// @brief Constructor that opens CSV file for writing
    /// @param outputPath Path to the CSV output file
    explicit CsvMarketDataSerializer(const std::string& outputPath);
    
    /// @brief Destructor that ensures file is properly closed
    ~CsvMarketDataSerializer() override;

    /// @brief Serialize a market data message to CSV format
    /// @param message The message to serialize
    void serializeMessage(const Message& message) const override;

  private:
    mutable std::ofstream _csvFile;
    mutable bool _headerWritten;
    
    /// @brief Write CSV header if not already written
    void writeHeader() const;
    
    /// @brief Convert message type to human-readable string
    /// @param type The message type
    /// @return String representation of the message type
    std::string messageTypeToString(MessageType type) const;
};

} // namespace beacon::market_data_generator::serializers