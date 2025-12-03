/*
 * Project: Beacon
 * File: messages_active.h
 * CME MDP Active Message Definitions
 *
 * This file controls which version of CME MDP messages are currently active.
 * Change the include below to switch versions across the entire system.
 */

#pragma once

// Currently active version: MDP v3.0
// To change versions, modify this single include line
#include "messages_active/v3_0/mdp_messages.h"

// Version history:
// v3.0 - Current active version
// v2.8 - Previous stable version (rollback option)
