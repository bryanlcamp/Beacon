#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <chrono>
#include <random>
#include <fstream>

namespace beacon {
namespace dataset {

struct PriceRange {
    double min;
    double max;
};

struct QuantityRange {
    uint32_t min;
    uint32_t max;
};

struct SymbolConfig {
    std::string symbol;
    uint32_t allocation;
    PriceRange bid_price_range;
    PriceRange ask_price_range;
    QuantityRange bid_quantity_range;
    QuantityRange ask_quantity_range;
    double spread_percent;
    uint32_t volume_m;
    uint32_t bid_weight_percent;
    uint32_t ask_weight_percent;
    uint32_t trade_percent;
};

struct GlobalSettings {
    uint64_t message_count;
    std::string exchange;
    uint64_t timestamp_start;
    uint32_t random_seed;
};

struct DatasetConfig {
    GlobalSettings global_settings;
    std::vector<SymbolConfig> symbols;
    std::string output_filename;
};

enum class MessageType : uint8_t {
    QUOTE = 1,
    TRADE = 2,
    BOOK_UPDATE = 3
};

struct MarketMessage {
    uint64_t timestamp_ns;
    MessageType type;
    std::string symbol;
    double price;
    uint32_t quantity;
    char side; // 'B' for bid, 'A' for ask
    uint32_t sequence_number;
} __attribute__((packed));

class DatasetGenerator {
public:
    explicit DatasetGenerator(const DatasetConfig& config);

    // Generate complete dataset
    bool generate();

    // Generate to specific formats
    bool generate_binary(const std::string& filename);
    bool generate_csv(const std::string& filename);
    bool generate_json(const std::string& filename);

    // Performance metrics
    struct GenerationStats {
        uint64_t messages_generated;
        uint64_t generation_time_ns;
        double messages_per_second;
        size_t file_size_bytes;
    };

    GenerationStats get_stats() const { return stats_; }

private:
    DatasetConfig config_;
    GenerationStats stats_;
    std::mt19937_64 rng_;

    // Message generation
    MarketMessage generate_quote_message(const SymbolConfig& symbol_cfg, uint64_t timestamp);
    MarketMessage generate_trade_message(const SymbolConfig& symbol_cfg, uint64_t timestamp);

    // Price movement simulation
    double simulate_price_walk(const std::string& symbol, double current_price, const PriceRange& range);

    // Timing utilities
    uint64_t get_next_timestamp(uint64_t current, const SymbolConfig& symbol_cfg);

    // Output formatting
    void write_binary_message(std::ofstream& file, const MarketMessage& msg);
    void write_csv_message(std::ofstream& file, const MarketMessage& msg);
    void write_json_message(std::ofstream& file, const MarketMessage& msg, bool is_last);
};

// JSON configuration parser
class ConfigParser {
public:
    static DatasetConfig parse_json_file(const std::string& filename);
    static DatasetConfig parse_json_string(const std::string& json_content);

private:
    static SymbolConfig parse_symbol_config(const std::string& json_object);
    static GlobalSettings parse_global_settings(const std::string& json_object);
};

} // namespace dataset
} // namespace beacon
