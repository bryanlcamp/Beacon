// Listen for UDP multicast data and decode messages (simplified demo)
#include <iostream>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include "CMEMessageParser.h"

// Example using CME SBE-generated decoder (replace with actual generated class names)
#include "MDIncrementalRefreshBook.h" // SBE-generated class (example)

std::vector<MDEntry> CMEMessageParser::parseMDEntries(const uint8_t* data, size_t length) {
    std::vector<MDEntry> entries;
    // Replace with actual SBE decoder usage
    MDIncrementalRefreshBook decoder;
    decoder.wrapForDecode(data, 0, length);

    for (auto entry = decoder.noMDEntries().begin(); entry != decoder.noMDEntries().end(); ++entry) {
        MDEntry mdEntry;
        mdEntry.mDEntryType = entry->mDEntryType();
        mdEntry.mDEntryPx = entry->mDEntryPx();
        entries.push_back(mdEntry);
    }
    return entries;
}

std::optional<double> CMEMessageParser::extractBestBid(const std::vector<MDEntry>& entries) {
    for (const auto& entry : entries) {
        if (entry.mDEntryType == '0') {
            return entry.mDEntryPx;
        }
    }
    return std::nullopt;
}

void CMEMessageParser::listenAndDecode(const char* multicast_ip, int port) {
    int sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        std::cerr << "Socket creation failed" << std::endl;
        return;
    }

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        std::cerr << "Bind failed" << std::endl;
        close(sock);
        return;
    }

    ip_mreq mreq{};
    mreq.imr_multiaddr.s_addr = inet_addr(multicast_ip);
    mreq.imr_interface.s_addr = INADDR_ANY;
    if (setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq)) < 0) {
        std::cerr << "Multicast join failed" << std::endl;
        close(sock);
        return;
    }

    std::cout << "Listening for CME MDP messages on " << multicast_ip << ":" << port << std::endl;
    uint8_t buffer[8192];
    while (true) {
        ssize_t len = recv(sock, buffer, sizeof(buffer), 0);
        if (len > 0) {
            // Pass raw bytes to SBE/FAST decoder
            auto entries = parseMDEntries(buffer, len);
            auto bestBid = extractBestBid(entries);
            if (bestBid) {
                std::cout << "Best Bid: " << *bestBid << std::endl;
            }
        }
    }
    close(sock);
}
