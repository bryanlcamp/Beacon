/*
 * Project: Beacon
 * File: messages_active.h
 * NASDAQ ITCH Active Message Definitions
 *
 * This file controls which version of NASDAQ ITCH messages are currently active.
 * Change the include below to switch versions across the entire system.
 */

#pragma once

// Currently active version: ITCH v5.0
// To change versions, modify this single include line
#include "messages_active/v5_0/itch_messages.h"

// Version history:
// v5.0 - Current active version
// v4.1 - Previous stable version (rollback option)
