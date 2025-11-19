// ---------------------------------------------------------------------------
// @file        itch_feed_handler.h
// Project     : Beacon
// Component   : NSDQ ITCH 5.0
// Description : Market Data Feed Handler for NSDQ ITCH 5.0 messages.
// Author      : Bryan Camp
// ---------------------------------------------------------------------------

#pragma once

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <stdexcept>

#include "itch_message_types.h"
#include "hft/ringbuffer/spsc_ringbuffer.h"

namespace beaconrb = beacon::hft::ringbuffer;

namespace beacon::nsdq::market_data::itch {

  /**
   * @class ItchFeedHandler
   * @brief Converts ITCH packets byte arrays to ITCH messages and pushes them down the pipeline.
   *
   * Usage:
   *   SpScRingBuffer<ItchMessageVariant> buffer;
   *   ItchFeedHandler parser(buffer);
   *.  parser.processPacket(rawPacket, packetSize);
  */
  class ItchFeedHandler {

    public:
      explicit ItchFeedHandler(beaconrb::SpScRingBuffer<ItchMessageVariant>& rbItchMessages)
        : _rbItchMessages(rbItchMessages) {}

      // Non-copyable
      ItchFeedHandler(const ItchFeedHandler&) = delete;
      ItchFeedHandler &operator=(const ItchFeedHandler&) = delete;

      // Non-movable
      ItchFeedHandler(ItchFeedHandler &&) = delete;
      ItchFeedHandler& operator=(ItchFeedHandler &&) = delete;

      /**
        * @brief Decodes a raw, binary ITCH packet, possibly containing multiple messages.
        *        Forwards this message down the pipeline via our SpSc lock-free queue.
        *        Note that packets are "packed" together with no delimiter. The first char
        *        of the message tells us the type. We cast the # of raw bytes according to
        *        to the type of ITCH message, and keep advancing through the packet.
        *  @param rawPacket  A packet of ITCH messages.
        *. @param packetSize The number of bytes in the packet.
        *. @note  populates the provided ring buffer (ctor) as new packets arrive
        *.
        *  @throws std::runtime_error if packet is malformed or an unknown type.
        */
      void processPacket(const char* rawPacket, size_t packetSize) {
        size_t packetOffset = 0;

        // Confirm there enough bytes left in the packet for this message type.
        auto ensureBytes = [&](size_t requiredBytes) {
          if (packetOffset + requiredBytes > packetSize) {
            throw std::runtime_error("Packet truncated");
          }
         };

        // Per the spec, all data types are POD (plain old data), hence memcpy.
        // We enqueue each ITCH message as we're iterating through the packet.
        
        // Exception handling strategy: Process as many valid messages as possible.
        // If an error occurs, the successfully parsed messages remain in the ring buffer.
        // This allows partial packet recovery rather than losing all data on any error.
        size_t messagesProcessed = 0;
        
        try {
          while (packetOffset < packetSize) {
          MessageType type = static_cast<MessageType>(rawPacket[packetOffset]);
          switch (type) {
            case MessageType::AddOrder: {
              ensureBytes(sizeof(AddOrderMessage));
              AddOrderMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::Trade: {
              ensureBytes(sizeof(TradeMessage));
              TradeMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::OrderExecuted: {
              ensureBytes(sizeof(OrderExecutedMessage));
              OrderExecutedMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::OrderCancel: {
              ensureBytes(sizeof(OrderCancelMessage));
              OrderCancelMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::OrderDelete: {
              ensureBytes(sizeof(OrderDeleteMessage));
              OrderDeleteMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::ReplaceOrder: {
              ensureBytes(sizeof(ReplaceOrderMessage));
              ReplaceOrderMessage msg;
              std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
              if (_rbItchMessages.tryPush(msg)) {
                messagesProcessed++;
              }
              packetOffset += sizeof(msg);
              break;
            }
            case MessageType::MarketDepth: {
              ensureBytes(sizeof(MarketDepthMessage));
                MarketDepthMessage msg;
                std::memcpy(&msg, rawPacket + packetOffset, sizeof(msg));
                if (_rbItchMessages.tryPush(msg)) {
                  messagesProcessed++;
                }
                packetOffset += sizeof(msg);
                break;
              }
              default:
              throw std::runtime_error("Unknown ITCH message type: " + std::to_string(static_cast<int>(type)));
            } // end switch
          } // end while
        } catch (const std::exception& e) {
          // Partial packet processing: Some messages may have been successfully processed
          // and are available in the ring buffer. Re-throw with context about what was saved.
          throw std::runtime_error("ITCH packet processing failed at offset " + 
                                  std::to_string(packetOffset) + "/" + std::to_string(packetSize) +
                                  " (processed " + std::to_string(messagesProcessed) + " messages): " + 
                                  e.what());
        }
      }

      private:
        // We use a variant so that our ring buffer can hold any ITCH message type.
        beaconrb::SpScRingBuffer<ItchMessageVariant>& _rbItchMessages;
    };
  }