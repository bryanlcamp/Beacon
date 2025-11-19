/*
 * =============================================================================
 * Project:      Beacon
 * Application:  exchange_market_data_generator
 * Purpose:      CSV serializer implementation for human-readable output
 * Author:       Bryan Camp
 * =============================================================================
 */

#include "../../include/serializers/CsvSerializer.h"
#include "../../include/Message.h"
#include <iomanip>
#include <stdexcept>
#include <chrono>

namespace beacon::market_data_generator::serializers {

CsvMarketDataSerializer::CsvMarketDataSerializer(const std::string& outputPath)
    : _headerWritten(false) {
    _csvFile.open(outputPath);
    if (!_csvFile.is_open()) {
        throw std::runtime_error("Could not open CSV output file: " + outputPath);
    }
}

CsvMarketDataSerializer::~CsvMarketDataSerializer() {
    if (_csvFile.is_open()) {
        _csvFile.close();
    }
}

void CsvMarketDataSerializer::serializeMessage(const Message& message) const {
    // Write header on first message
    if (!_headerWritten) {
        writeHeader();
        _headerWritten = true;
    }
    
    // Generate current timestamp in nanoseconds since epoch
    auto now = std::chrono::high_resolution_clock::now();
    auto timestamp = std::chrono::duration_cast<std::chrono::nanoseconds>(
        now.time_since_epoch()).count();
    
    // Write CSV row
    _csvFile << timestamp << ","
             << message.symbol << ","
             << messageTypeToString(message.messageType) << ","
             << message.type << ","
             << std::fixed << std::setprecision(2) << message.price << ","
             << message.quantity << ","
             << message.sequenceNumber << ","
             << (message.messageType == MessageType::Last ? message.sequenceNumber : 0)
             << "\n";
    
    // Flush periodically for real-time visibility
    static size_t messageCount = 0;
    if (++messageCount % 1000 == 0) {
        _csvFile.flush();
    }
}

void CsvMarketDataSerializer::writeHeader() const {
    _csvFile << "timestamp,symbol,message_type,side,price,quantity,order_id,trade_id\n";
}

std::string CsvMarketDataSerializer::messageTypeToString(MessageType type) const {
    switch (type) {
        case MessageType::Bid:
            return "Bid";
        case MessageType::Ask:
            return "Ask";
        case MessageType::Last:
            return "Trade";
        default:
            return "Unknown";
    }
}

} // namespace beacon::market_data_generator::serializers