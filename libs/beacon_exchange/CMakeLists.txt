# =============================================================================
# Project:      Beacon
# Purpose:      Unified exchanges library build configuration
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.20)
project(beacon_exchange)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Create header-only interface library for now
add_library(beacon_exchange INTERFACE)

# Export include directories
target_include_directories(beacon_exchange INTERFACE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

message(STATUS "Beacon Exchange configured as header-only library")