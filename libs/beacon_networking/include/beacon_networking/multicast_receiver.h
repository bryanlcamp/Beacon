/*
 * =============================================================================
 * Project:      Beacon
 * Library:      networking
 * Purpose:      HFT-optimized UDP multicast receiver
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <string>
#include <memory>
#include <cstdint>
#include <sys/socket.h>

namespace beacon::networking {

class MulticastReceiver {
public:
    MulticastReceiver(const std::string& multicastAddr, uint16_t port);
    ~MulticastReceiver();
    
    // Setup
    bool bind();
    bool joinMulticastGroup();
    void leaveMulticastGroup();
    
    // HFT-optimized receive
    ssize_t recvfrom(void* buffer, size_t size, 
                     struct sockaddr* srcAddr = nullptr, 
                     socklen_t* addrLen = nullptr);
    
    // HFT optimizations
    void setReceiveBufferSize(int size);
    void setReuseAddress(bool enabled = true);
    void setTimeout(int seconds, int microseconds = 0);
    
    // Status
    bool isJoined() const;
    std::string getMulticastAddress() const;
    uint16_t getPort() const;
    int getSocket() const;

private:
    class Impl;
    std::unique_ptr<Impl> pImpl_;
};

} // namespace beacon::networking
