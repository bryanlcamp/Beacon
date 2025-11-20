/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Burst rule implementation for controlling message bursts
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <chrono>
#include <cmath>
#include <IPlaybackRule.h>

namespace playback::rules {

/**
 * @brief Rule that implements burst timing behavior
 * 
 * This rule creates bursts of messages at specified intervals, similar to
 * the mathematical burst calculations in the generator system.
 * 
 * Configuration parameters:
 * - burstSize: Number of messages in each burst
 * - burstIntervalMs: Time between burst starts (milliseconds)
 * - speedFactor: Multiplier for burst timing (1.0 = normal speed)
 * - maxRateLimit: Maximum messages per second during burst
 */
class BurstRule : public IPlaybackRule {
private:
    size_t _burstSize;
    std::chrono::milliseconds _burstInterval;
    double _speedFactor;
    size_t _maxRateLimit;
    
    // Burst state tracking
    std::chrono::steady_clock::time_point _lastBurstStart;
    size_t _messagesInCurrentBurst;
    size_t _totalMessagesSent;
    bool _inBurst;
    
public:
    BurstRule(size_t burstSize, 
              std::chrono::milliseconds burstInterval,
              double speedFactor = 1.0,
              size_t maxRateLimit = 100000)
        : _burstSize(burstSize)
        , _burstInterval(burstInterval)
        , _speedFactor(speedFactor)
        , _maxRateLimit(maxRateLimit)
        , _messagesInCurrentBurst(0)
        , _totalMessagesSent(0)
        , _inBurst(false) {}

    Priority getPriority() const override {
        return Priority::TIMING;
    }

    Decision apply(size_t /* messageIndex */, 
                   const char* /* message */, 
                   const PlaybackState& /* state */, 
                   Decision currentDecision) override {
        
        auto now = std::chrono::steady_clock::now();
        Decision decision = currentDecision;
        
        // Initialize timing on first message
        if (_totalMessagesSent == 0) {
            _lastBurstStart = now;
            _inBurst = true;
            _messagesInCurrentBurst = 0;
        }
        
        // Check if we should start a new burst
        auto timeSinceLastBurst = std::chrono::duration_cast<std::chrono::milliseconds>(
            now - _lastBurstStart);
        
        if (!_inBurst && timeSinceLastBurst >= _burstInterval) {
            // Start new burst
            _inBurst = true;
            _messagesInCurrentBurst = 0;
            _lastBurstStart = now;
        }
        
        if (_inBurst) {
            if (_messagesInCurrentBurst < _burstSize) {
                // Send message immediately during burst
                decision.outcome = Outcome::SEND_NOW;
                
                // Calculate inter-message delay within burst to respect rate limit
                if (_maxRateLimit > 0) {
                    double messagesPerSecond = static_cast<double>(_maxRateLimit) * _speedFactor;
                    auto delayBetweenMessages = std::chrono::microseconds(
                        static_cast<int64_t>(1000000.0 / messagesPerSecond));
                    decision.accumulatedDelay += delayBetweenMessages;
                }
                
                _messagesInCurrentBurst++;
                _totalMessagesSent++;
                
                // End burst if we've sent enough messages
                if (_messagesInCurrentBurst >= _burstSize) {
                    _inBurst = false;
                }
            } else {
                // Burst complete, wait for next interval
                _inBurst = false;
                decision.outcome = Outcome::VETO; // Hold message until next burst
            }
        } else {
            // Between bursts - hold the message
            decision.outcome = Outcome::VETO;
        }
        
        return decision;
    }
    
    void initialize() override {
        _messagesInCurrentBurst = 0;
        _totalMessagesSent = 0;
        _inBurst = false;
    }
    
    void onPlaybackStart() override {
        _lastBurstStart = std::chrono::steady_clock::now();
        _inBurst = true;
        _messagesInCurrentBurst = 0;
    }
    
    void onPlaybackEnd() override {
        // Reset state
        _inBurst = false;
        _messagesInCurrentBurst = 0;
    }
    
    // Utility methods for testing and monitoring
    bool isInBurst() const { return _inBurst; }
    size_t getCurrentBurstCount() const { return _messagesInCurrentBurst; }
    size_t getTotalMessagesSent() const { return _totalMessagesSent; }
    
    // Configuration accessors
    size_t getBurstSize() const { return _burstSize; }
    std::chrono::milliseconds getBurstInterval() const { return _burstInterval; }
    double getSpeedFactor() const { return _speedFactor; }
};

} // namespace playback::rules