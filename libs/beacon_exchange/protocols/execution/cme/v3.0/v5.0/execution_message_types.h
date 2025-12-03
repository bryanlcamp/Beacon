/*
 * Project: Beacon
 * File: execution_message_types.h
 * CME execution message structs for direct binary parsing.
 *
 * These structs represent the raw binary message formats for CME execution protocol.
 * Field order, types, and alignment must match the official CME specification.
 * Designed for direct memcpy from raw binary messages.
 *
 * Do not change field order, types, or alignment unless updating for a new protocol version.
 * For details, see CME Execution Protocol Specification.
 */

#pragma once

#include <cstdint>

namespace beacon::cme::execution::v5_0 {

// CME-specific execution messages will go here
// NASDAQ OUCH messages moved to beacon::nasdaq::execution::current

} // namespace beacon::cme::execution::v5_0