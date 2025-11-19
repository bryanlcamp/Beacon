/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Wave rule implementation for controlling message rates in waves
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <chrono>
#include <cmath>
#include <IPlaybackRule.h>

namespace playback::rules {

/**
 * @brief Rule that implements wave timing behavior
 * 
 * This rule varies the message sending rate in a sinusoidal wave pattern,
 * similar to the mathematical wave calculations in the generator system.
 * 
 * Configuration parameters:
 * - periodMs: Duration of one complete wave cycle (milliseconds)
 * - minRate: Minimum messages per second (wave trough)
 * - maxRate: Maximum messages per second (wave peak)  
 * - speedFactor: Multiplier for wave timing (1.0 = normal speed)
 */
class WaveRule : public IPlaybackRule {
private:
    std::chrono::milliseconds _period;
    double _minRate;
    double _maxRate;
    double _speedFactor;
    
    // Wave state tracking
    std::chrono::steady_clock::time_point _waveStart;
    std::chrono::steady_clock::time_point _lastMessageTime;
    size_t _totalMessagesSent;
    
    /**
     * Calculate current wave amplitude (0.0 to 1.0) based on elapsed time
     */
    double calculateWaveAmplitude(std::chrono::steady_clock::time_point currentTime) const {
        auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
            currentTime - _waveStart);
        
        double elapsedMs = elapsed.count() / 1000.0; // Convert to milliseconds
        double periodMs = _period.count();
        
        // Calculate position within the wave cycle (0.0 to 1.0)
        double wavePosition = std::fmod(elapsedMs / periodMs, 1.0);
        
        // Convert to radians for sine calculation (0 to 2π)
        double wavePhase = wavePosition * 2.0 * M_PI;
        
        // Generate sine wave: -1.0 to 1.0, then normalize to 0.0 to 1.0
        double sineValue = std::sin(wavePhase);
        return (sineValue + 1.0) / 2.0; // Convert from [-1,1] to [0,1]
    }
    
    /**
     * Calculate target message rate based on current wave position
     */
    double calculateCurrentRate(std::chrono::steady_clock::time_point currentTime) const {
        double amplitude = calculateWaveAmplitude(currentTime);
        
        // Interpolate between min and max rates based on wave amplitude
        double rateRange = _maxRate - _minRate;
        double currentRate = _minRate + (amplitude * rateRange);
        
        // Apply speed factor
        return currentRate * _speedFactor;
    }
    
    /**
     * Calculate delay needed to achieve target rate
     */
    std::chrono::microseconds calculateDelayForRate(double targetRate) const {
        if (targetRate <= 0.0) {
            return std::chrono::microseconds(1000000); // 1 second delay for zero rate
        }
        
        // Calculate microseconds between messages for target rate
        double microsecondsPerMessage = 1000000.0 / targetRate; // 1 second = 1,000,000 microseconds
        return std::chrono::microseconds(static_cast<int64_t>(microsecondsPerMessage));
    }
    
public:
    WaveRule(std::chrono::milliseconds period,
             double minRate,
             double maxRate, 
             double speedFactor = 1.0)
        : _period(period)
        , _minRate(minRate) 
        , _maxRate(maxRate)
        , _speedFactor(speedFactor)
        , _totalMessagesSent(0) {
        
        // Validation
        if (_minRate < 0) _minRate = 0;
        if (_maxRate < _minRate) _maxRate = _minRate;
        if (_speedFactor <= 0) _speedFactor = 1.0;
    }

    Priority getPriority() const override {
        return Priority::TIMING;
    }

    Decision apply(size_t messageIndex, 
                   const char* message, 
                   const PlaybackState& state, 
                   Decision currentDecision) override {
        
        auto now = std::chrono::steady_clock::now();
        Decision decision = currentDecision;
        
        // Initialize timing on first message
        if (_totalMessagesSent == 0) {
            _waveStart = now;
            _lastMessageTime = now;
            _totalMessagesSent = 1;
            decision.outcome = Outcome::SEND_NOW; // Send first message immediately
            return decision;
        }
        
        // Calculate current target rate based on wave position
        double currentRate = calculateCurrentRate(now);
        
        // Calculate required delay to achieve target rate
        auto requiredDelay = calculateDelayForRate(currentRate);
        
        // Check if enough time has passed since last message
        auto timeSinceLastMessage = std::chrono::duration_cast<std::chrono::microseconds>(
            now - _lastMessageTime);
        
        if (timeSinceLastMessage >= requiredDelay) {
            // Enough time has passed, send the message
            decision.outcome = Outcome::SEND_NOW;
            _lastMessageTime = now;
            _totalMessagesSent++;
        } else {
            // Need to wait longer - add remaining delay
            auto remainingDelay = requiredDelay - timeSinceLastMessage;
            decision.accumulatedDelay += remainingDelay;
            decision.outcome = Outcome::CONTINUE;
        }
        
        return decision;
    }
    
    void initialize() override {
        _totalMessagesSent = 0;
    }
    
    void onPlaybackStart() override {
        auto now = std::chrono::steady_clock::now();
        _waveStart = now;
        _lastMessageTime = now;
        _totalMessagesSent = 0;
    }
    
    void onPlaybackEnd() override {
        // Reset state
        _totalMessagesSent = 0;
    }
    
    // Utility methods for testing and monitoring
    double getCurrentRate() const {
        return calculateCurrentRate(std::chrono::steady_clock::now());
    }
    
    double getCurrentAmplitude() const {
        return calculateWaveAmplitude(std::chrono::steady_clock::now());
    }
    
    size_t getTotalMessagesSent() const { return _totalMessagesSent; }
    
    // Configuration accessors
    std::chrono::milliseconds getPeriod() const { return _period; }
    double getMinRate() const { return _minRate; }
    double getMaxRate() const { return _maxRate; }
    double getSpeedFactor() const { return _speedFactor; }
    
    // Get elapsed time in current wave cycle
    std::chrono::milliseconds getElapsedInCycle() const {
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - _waveStart);
        return std::chrono::milliseconds(elapsed.count() % _period.count());
    }
};

} // namespace playback::rules