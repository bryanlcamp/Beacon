/*
 * =============================================================================
 * Project:      Beacon
 * Application:  playback
 * Purpose:      Abstract interface for message senders (UDP multicast, TCP,
 *               file output, etc.) used during market data playback.
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

#include <cstddef>

#include "../PlaybackState.h"

namespace playback::advisors {

  enum class MessagePriority {
    NORMAL = 0,
    ELEVATED = 1,
    CRITICAL = 2,
    EMERGENCY = 3
  };

  class IClassifyMessagePriority {
    public:
      virtual ~IClassifyMessagePriority() = default;
      virtual MessagePriority classify(size_t messageIndex,
                                      const char* message,
                                      const playback::rules::PlaybackState& state) = 0;
  };
} // namespace playback::advisors