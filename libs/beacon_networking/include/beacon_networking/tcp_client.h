/*
 * =============================================================================
 * Project:      Beacon
 * Library:      networking
 * Purpose:      HFT-optimized TCP client
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <string>
#include <memory>
#include <cstdint>

namespace beacon::networking {

class TcpClient {
public:
    explicit TcpClient(const std::string& host, uint16_t port);
    ~TcpClient();
    
    // Connection management
    bool connect();
    void disconnect();
    bool isConnected() const;
    
    // HFT-optimized I/O
    ssize_t recv(void* buffer, size_t size, int flags = 0);
    ssize_t send(const void* buffer, size_t size, int flags = 0);
    ssize_t sendAll(const void* buffer, size_t size, int flags = 0);
    
    // HFT optimizations
    void setTcpNoDelay(bool enabled = true);
    void setReceiveBufferSize(int size);
    void setSendBufferSize(int size);
    void setKeepAlive(bool enabled = true);
    
    // Status
    std::string getRemoteAddress() const;
    uint16_t getRemotePort() const;
    int getSocket() const;

private:
    class Impl;
    std::unique_ptr<Impl> pImpl_;
};

} // namespace beacon::networking
