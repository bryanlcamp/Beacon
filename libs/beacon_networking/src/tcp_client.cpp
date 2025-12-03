/*
 * =============================================================================
 * Project:      Beacon
 * Library:      networking
 * Purpose:      HFT-optimized TCP client implementation
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <beacon_networking/tcp_client.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <stdexcept>

namespace beacon::networking {

class TcpClient::Impl {
public:
    std::string host_;
    uint16_t port_;
    int socket_;
    bool connected_;
    
    Impl(const std::string& host, uint16_t port)
        : host_(host), port_(port), socket_(-1), connected_(false) {}
    
    ~Impl() {
        disconnect();
    }
    
    bool connect() {
        if (connected_) return true;
        
        socket_ = socket(AF_INET, SOCK_STREAM, 0);
        if (socket_ < 0) {
            return false;
        }
        
        sockaddr_in serverAddr;
        std::memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_port = htons(port_);
        
        if (inet_pton(AF_INET, host_.c_str(), &serverAddr.sin_addr) <= 0) {
            ::close(socket_);
            socket_ = -1;
            return false;
        }
        
        if (::connect(socket_, reinterpret_cast<sockaddr*>(&serverAddr), sizeof(serverAddr)) < 0) {
            ::close(socket_);
            socket_ = -1;
            return false;
        }
        
        connected_ = true;
        return true;
    }
    
    void disconnect() {
        if (socket_ >= 0) {
            ::close(socket_);
            socket_ = -1;
        }
        connected_ = false;
    }
};

TcpClient::TcpClient(const std::string& host, uint16_t port)
    : pImpl_(std::make_unique<Impl>(host, port)) {}

TcpClient::~TcpClient() = default;

bool TcpClient::connect() {
    return pImpl_->connect();
}

void TcpClient::disconnect() {
    pImpl_->disconnect();
}

bool TcpClient::isConnected() const {
    return pImpl_->connected_;
}

ssize_t TcpClient::recv(void* buffer, size_t size, int flags) {
    if (!pImpl_->connected_) return -1;
    return ::recv(pImpl_->socket_, buffer, size, flags);
}

ssize_t TcpClient::send(const void* buffer, size_t size, int flags) {
    if (!pImpl_->connected_) return -1;
    return ::send(pImpl_->socket_, buffer, size, flags);
}

ssize_t TcpClient::sendAll(const void* buffer, size_t size, int flags) {
    if (!pImpl_->connected_) return -1;
    
    const char* data = static_cast<const char*>(buffer);
    size_t totalSent = 0;
    
    while (totalSent < size) {
        ssize_t sent = ::send(pImpl_->socket_, data + totalSent, size - totalSent, flags);
        if (sent <= 0) {
            return sent;
        }
        totalSent += sent;
    }
    
    return totalSent;
}

void TcpClient::setTcpNoDelay(bool enabled) {
    if (pImpl_->socket_ >= 0) {
        int flag = enabled ? 1 : 0;
        setsockopt(pImpl_->socket_, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));
    }
}

void TcpClient::setReceiveBufferSize(int size) {
    if (pImpl_->socket_ >= 0) {
        setsockopt(pImpl_->socket_, SOL_SOCKET, SO_RCVBUF, &size, sizeof(size));
    }
}

void TcpClient::setSendBufferSize(int size) {
    if (pImpl_->socket_ >= 0) {
        setsockopt(pImpl_->socket_, SOL_SOCKET, SO_SNDBUF, &size, sizeof(size));
    }
}

void TcpClient::setKeepAlive(bool enabled) {
    if (pImpl_->socket_ >= 0) {
        int flag = enabled ? 1 : 0;
        setsockopt(pImpl_->socket_, SOL_SOCKET, SO_KEEPALIVE, &flag, sizeof(flag));
    }
}

std::string TcpClient::getRemoteAddress() const {
    return pImpl_->host_;
}

uint16_t TcpClient::getRemotePort() const {
    return pImpl_->port_;
}

int TcpClient::getSocket() const {
    return pImpl_->socket_;
}

} // namespace beacon::networking
