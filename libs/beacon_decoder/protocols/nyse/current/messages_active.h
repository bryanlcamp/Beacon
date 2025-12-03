/*
 * Project: Beacon
 * File: messages_active.h
 * NYSE Pillar Active Message Definitions
 *
 * This file controls which version of NYSE Pillar messages are currently active.
 * Change the include below to switch versions across the entire system.
 */

#pragma once

// Currently active version: Pillar v2.1
// To change versions, modify this single include line
#include "messages_active/v2_1/pillar_messages.h"

// Version history:
// v2.1 - Current active version
// v2.0 - Previous stable version (rollback option)
