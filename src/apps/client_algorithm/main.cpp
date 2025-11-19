/*
 * =============================================================================
 * Project:      Beacon
 * Application:  client_algorithm
 * Purpose:      TCP/UDP client to test receiving market data from playback
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <iostream>
#include <cstring>
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <thread>
#include <atomic>

// Beacon HFT infrastructure for message decoding
#include <hft/ringbuffer/spsc_ringbuffer.h>
#include <hft/core/cpu_pause.h>
#include <nsdq/market_data/itch/v5/itch_message_types.h>

using namespace beacon::hft::ringbuffer;
using namespace beacon::nsdq::market_data::itch;

// Decoded market data message for processing
struct DecodedMarketMessage {
    MessageType messageType;
    uint64_t sequenceNumber;
    std::string symbol;
    uint32_t price;
    uint32_t quantity;
    char side;
    uint64_t timestamp;
    
    DecodedMarketMessage() = default;
    
    DecodedMarketMessage(MessageType type, uint64_t seq, const std::string& sym, 
                        uint32_t p, uint32_t qty, char s)
        : messageType(type), sequenceNumber(seq), symbol(sym), 
          price(p), quantity(qty), side(s), 
          timestamp(std::chrono::duration_cast<std::chrono::milliseconds>(
              std::chrono::steady_clock::now().time_since_epoch()).count()) {}
};

// Global SPSC queue for decoded messages
SpScRingBuffer<DecodedMarketMessage, 8192> g_messageQueue;
std::atomic<bool> g_processingActive{false};

// Message processing thread
void messageProcessingThread() {
    DecodedMarketMessage message;
    uint64_t processedCount = 0;
    
    while (g_processingActive.load(std::memory_order_relaxed)) {
        if (g_messageQueue.tryPop(message)) {
            processedCount++;
            
            // Process the decoded message (trading logic would go here)
            if (processedCount % 1000 == 0) {
                std::cout << "[PROCESSOR] Processed " << processedCount << " decoded messages"
                          << " (Latest: " << message.symbol << " $" 
                          << (message.price / 10000.0) << " qty:" << message.quantity << ")\n";
            }
        } else {
            // No messages available, yield CPU briefly
            beacon::hft::core::cpu_pause();
        }
    }
    
    std::cout << "[PROCESSOR] Final processed count: " << processedCount << " messages\n";
}

// Message decoder for ITCH binary format
bool decodeItchMessage(const char* buffer, size_t bytesRead, DecodedMarketMessage& decoded) {
    if (bytesRead < 1) return false;
    
    MessageType msgType = static_cast<MessageType>(buffer[0]);
    
    switch (msgType) {
        case MessageType::AddOrder: {
            if (bytesRead < sizeof(AddOrderMessage)) return false;
            
            const AddOrderMessage* addMsg = reinterpret_cast<const AddOrderMessage*>(buffer);
            
            // Extract symbol (remove padding)
            std::string symbol(addMsg->stock, 8);
            symbol.erase(symbol.find_last_not_of(" \0") + 1);
            
            decoded = DecodedMarketMessage(
                MessageType::AddOrder,
                addMsg->sequenceNumber,
                symbol,
                addMsg->price,
                addMsg->shares,
                addMsg->side
            );
            return true;
        }
        
        case MessageType::Trade: {
            if (bytesRead < sizeof(TradeMessage)) return false;
            
            const TradeMessage* tradeMsg = reinterpret_cast<const TradeMessage*>(buffer);
            
            // Extract symbol (remove padding)
            std::string symbol(tradeMsg->stock, 8);
            symbol.erase(symbol.find_last_not_of(" \0") + 1);
            
            decoded = DecodedMarketMessage(
                MessageType::Trade,
                tradeMsg->sequenceNumber,
                symbol,
                tradeMsg->price,
                tradeMsg->shares,
                tradeMsg->side
            );
            return true;
        }
        
        default:
            // Unsupported message type for now
            return false;
    }
}

void printUsage(const char* progName) {
    std::cout << "Usage:\n";
    std::cout << "  " << progName << " tcp [host] [port]          # TCP mode\n";
    std::cout << "  " << progName << " udp [mcast_addr] [port]    # UDP multicast mode\n\n";
    std::cout << "Examples:\n";
    std::cout << "  " << progName << " tcp 127.0.0.1 12345\n";
    std::cout << "  " << progName << " udp 239.255.0.1 12345\n";
}

int runTcpClient(const char* host, int port) {
    std::cout << "=============================================================================\n";
    std::cout << "          TCP MARKET DATA CLIENT - TEST RECEIVER                            \n";
    std::cout << "=============================================================================\n";
    std::cout << "Mode: TCP\n";
    std::cout << "Connecting to: " << host << ":" << port << "\n\n";
    
    // Create TCP socket
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        std::cerr << "ERROR: Failed to create socket: " << strerror(errno) << "\n";
        return 1;
    }
    
    // Setup server address
    sockaddr_in serverAddr;
    std::memset(&serverAddr, 0, sizeof(serverAddr));
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    
    if (inet_pton(AF_INET, host, &serverAddr.sin_addr) <= 0) {
        std::cerr << "ERROR: Invalid address: " << host << "\n";
        close(sock);
        return 1;
    }
    
    // Connect to server
    std::cout << "Connecting...\n";
    if (connect(sock, reinterpret_cast<sockaddr*>(&serverAddr), sizeof(serverAddr)) < 0) {
        std::cerr << "ERROR: Connection failed: " << strerror(errno) << "\n";
        std::cerr << "\nMake sure the playback server is running:\n";
        std::cerr << "  cd ../exchange_market_data_playback\n";
        std::cerr << "  ./build/exchange_market_data_playback --config config_tcp.json output.mdp\n";
        close(sock);
        return 1;
    }
    
    std::cout << "✓ Connected successfully!\n\n";
    std::cout << "Receiving market data (Press Ctrl+C to stop)...\n";
    std::cout << "=============================================================================\n\n";
    
    // Receive messages
    constexpr size_t MESSAGE_SIZE = 32; // All market data messages are 32 bytes
    char buffer[MESSAGE_SIZE];
    size_t messagesReceived = 0;
    size_t totalBytes = 0;
    
    while (true) {
        ssize_t bytesRead = recv(sock, buffer, MESSAGE_SIZE, 0);
        
        if (bytesRead == 0) {
            std::cout << "\n✓ Server closed connection (playback complete)\n";
            break;
        }
        
        if (bytesRead < 0) {
            std::cerr << "\nERROR: Receive failed: " << strerror(errno) << "\n";
            break;
        }
        
        messagesReceived++;
        totalBytes += bytesRead;
        
        // Print progress every 1000 messages
        if (messagesReceived % 1000 == 0) {
            std::cout << "Received " << messagesReceived << " messages (" 
                      << totalBytes << " bytes)\n";
        }
        
        // Optional: Print first few bytes of first message
        if (messagesReceived == 1) {
            std::cout << "First message (first 16 bytes): ";
            for (int i = 0; i < 16 && i < bytesRead; i++) {
                printf("%02x ", static_cast<unsigned char>(buffer[i]));
            }
            std::cout << "\n\n";
        }
    }
    
    std::cout << "\n=============================================================================\n";
    std::cout << "                         RECEPTION COMPLETE                                 \n";
    std::cout << "=============================================================================\n";
    std::cout << "Total messages: " << messagesReceived << "\n";
    std::cout << "Total bytes:    " << totalBytes << "\n";
    std::cout << "=============================================================================\n";
    
    close(sock);
    return 0;
}

int runUdpClient(const char* multicastAddr, int port) {
    std::cout << "=============================================================================\n";
    std::cout << "          UDP MARKET DATA CLIENT - TEST RECEIVER                            \n";
    std::cout << "=============================================================================\n";
    std::cout << "Mode: UDP Multicast\n";
    std::cout << "Listening on: " << multicastAddr << ":" << port << "\n\n";
    
    // Start message processing thread
    g_processingActive.store(true, std::memory_order_relaxed);
    std::thread processorThread(messageProcessingThread);
    std::cout << "[INFO] Started message processing thread\n";
    
    // Create UDP socket
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sock < 0) {
        std::cerr << "ERROR: Failed to create socket: " << strerror(errno) << "\n";
        return 1;
    }
    
    // Allow multiple listeners on same port
    int reuse = 1;
    if (setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse)) < 0) {
        std::cerr << "WARNING: Failed to set SO_REUSEADDR: " << strerror(errno) << "\n";
    }
    
    // Increase receive buffer size for high-frequency data
    int recvBufferSize = 2 * 1024 * 1024; // 2 MB
    if (setsockopt(sock, SOL_SOCKET, SO_RCVBUF, &recvBufferSize, sizeof(recvBufferSize)) < 0) {
        std::cerr << "WARNING: Failed to set receive buffer size: " << strerror(errno) << "\n";
    }
    
    // Bind to port
    sockaddr_in localAddr;
    std::memset(&localAddr, 0, sizeof(localAddr));
    localAddr.sin_family = AF_INET;
    localAddr.sin_addr.s_addr = INADDR_ANY;
    localAddr.sin_port = htons(port);
    
    if (bind(sock, reinterpret_cast<sockaddr*>(&localAddr), sizeof(localAddr)) < 0) {
        std::cerr << "ERROR: Failed to bind socket: " << strerror(errno) << "\n";
        close(sock);
        return 1;
    }
    
    // Join multicast group
    ip_mreq mreq;
    mreq.imr_multiaddr.s_addr = inet_addr(multicastAddr);
    mreq.imr_interface.s_addr = INADDR_ANY;
    
    if (setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq)) < 0) {
        std::cerr << "ERROR: Failed to join multicast group: " << strerror(errno) << "\n";
        close(sock);
        return 1;
    }
    
    std::cout << "✓ Joined multicast group successfully!\n\n";
    std::cout << "Receiving market data (Press Ctrl+C to stop)...\n";
    std::cout << "=============================================================================\n\n";
    
    // Receive messages
    constexpr size_t BUFFER_SIZE = 1024;
    char buffer[BUFFER_SIZE];
    size_t messagesReceived = 0;
    size_t totalBytes = 0;
    
    while (true) {
        sockaddr_in senderAddr;
        socklen_t senderAddrLen = sizeof(senderAddr);
        
        ssize_t bytesRead = recvfrom(sock, buffer, BUFFER_SIZE, 0,
                                     reinterpret_cast<sockaddr*>(&senderAddr),
                                     &senderAddrLen);
        
        if (bytesRead < 0) {
            std::cerr << "\nERROR: Receive failed: " << strerror(errno) << "\n";
            break;
        }
        
        messagesReceived++;
        totalBytes += bytesRead;
        
        // Decode message and put onto SPSC queue
        DecodedMarketMessage decodedMsg;
        if (decodeItchMessage(buffer, bytesRead, decodedMsg)) {
            // Try to push to queue (non-blocking)
            if (!g_messageQueue.tryPush(decodedMsg)) {
                // Queue full - could log dropped messages in production
                static uint64_t droppedCount = 0;
                if (++droppedCount % 1000 == 0) {
                    std::cout << "[WARNING] Dropped " << droppedCount 
                              << " messages (queue full)\n";
                }
            }
        } else {
            // Could not decode message - might be different format or corrupted
            static uint64_t decodeFailures = 0;
            if (++decodeFailures % 1000 == 0) {
                std::cout << "[WARNING] Failed to decode " << decodeFailures 
                          << " messages (size: " << bytesRead << " bytes)\n";
            }
        }

        // Print progress every 1000 messages
        if (messagesReceived % 1000 == 0) {
            std::cout << "Received " << messagesReceived << " messages (" 
                      << totalBytes << " bytes)\n";
        }
        
        // Optional: Print first few bytes of first message
        if (messagesReceived == 1) {
            char senderIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &senderAddr.sin_addr, senderIp, INET_ADDRSTRLEN);
            std::cout << "First message from " << senderIp << ":" << ntohs(senderAddr.sin_port) << "\n";
            std::cout << "Message size: " << bytesRead << " bytes\n";
            std::cout << "First 16 bytes: ";
            for (int i = 0; i < 16 && i < bytesRead; i++) {
                printf("%02x ", static_cast<unsigned char>(buffer[i]));
            }
            std::cout << "\n\n";
        }
    }
    
    std::cout << "\n=============================================================================\n";
    std::cout << "                         RECEPTION COMPLETE                                 \n";
    std::cout << "=============================================================================\n";
    std::cout << "Total messages: " << messagesReceived << "\n";
    std::cout << "Total bytes:    " << totalBytes << "\n";
    std::cout << "=============================================================================\n";
    
    close(sock);
    return 0;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "ERROR: Protocol not specified\n\n";
        printUsage(argv[0]);
        return 1;
    }
    
    std::string protocol = argv[1];
    
    if (protocol == "tcp") {
        const char* host = (argc > 2) ? argv[2] : "127.0.0.1";
        int port = (argc > 3) ? std::atoi(argv[3]) : 12345;
        return runTcpClient(host, port);
    }
    else if (protocol == "udp") {
        const char* multicastAddr = (argc > 2) ? argv[2] : "239.255.0.1";
        int port = (argc > 3) ? std::atoi(argv[3]) : 12345;
        return runUdpClient(multicastAddr, port);
    }
    else {
        std::cerr << "ERROR: Invalid protocol '" << protocol << "' (must be 'tcp' or 'udp')\n\n";
        printUsage(argv[0]);
        return 1;
    }
}
