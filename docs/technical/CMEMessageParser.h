#pragma once
#include <cstdint>
#include <vector>
#include <optional>

// Represents a single MDEntry from the CME MDP message
struct MDEntry {
    char mDEntryType; // 269
    double mDEntryPx; // 270
};

// Parses a binary CME MDP message and extracts MDEntries (stub for demo)
class CMEMessageParser {
public:
    // Parse the binary message and return all MDEntries
    static std::vector<MDEntry> parseMDEntries(const uint8_t* data, size_t length);

    // Extracts the best bid price (MDEntryPx where MDEntryType == '0')
    static std::optional<double> extractBestBid(const std::vector<MDEntry>& entries);

    // Listen for UDP multicast data and decode messages (simplified demo)
    // In production, this would run in a dedicated thread or event loop
    static void listenAndDecode(const char* multicast_ip, int port);
};
