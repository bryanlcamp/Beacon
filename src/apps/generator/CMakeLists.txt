# =============================================================================
# Project:      Beacon
# Application:  generator
# Purpose:      Build configuration for generator with ELITE HFT libraries
# Author:       Bryan Camp
# =============================================================================


cmake_minimum_required(VERSION 3.20)
project(generator)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set vendor path explicitly - nlohmann/json.hpp is directly in vendor/nlohmann/
set(VENDOR_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../vendor")
message(STATUS "Looking for nlohmann/json at: ${VENDOR_DIR}/nlohmann/json.hpp")

# Check if nlohmann/json exists at the correct location
if(EXISTS "${VENDOR_DIR}/nlohmann/json.hpp")
    message(STATUS "✅ Found nlohmann/json.hpp")
else()
    message(FATAL_ERROR "❌ nlohmann/json.hpp not found at: ${VENDOR_DIR}/nlohmann/json.hpp")
endif()

# Include directories - point directly to vendor/nlohmann (not vendor/nlohmann/include)
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${VENDOR_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/beacon_encoder/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/beacon_exchange/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/beacon_hft/include
)

# Start with minimal sources to get compiling first
set(SOURCES
    src/main.cpp
    # Comment out problematic sources until we fix namespace issues
    # src/ConfigProvider.cpp
    # src/MessageGenerator.cpp
)

# Find required packages
find_package(Threads REQUIRED)

# Try to find nlohmann_json package
find_package(nlohmann_json QUIET)

# Add libraries in correct dependency order with unique binary directories
add_subdirectory(../../../libs/beacon_exchange ${CMAKE_BINARY_DIR}/beacon_exchange_build)
add_subdirectory(../../../libs/beacon_hft ${CMAKE_BINARY_DIR}/beacon_hft_build)
add_subdirectory(../../../libs/beacon_encoder ${CMAKE_BINARY_DIR}/beacon_encoder_build)

add_executable(generator ${SOURCES})
target_compile_features(generator PRIVATE cxx_std_20)

# Link libraries
target_link_libraries(generator 
    PRIVATE 
    beacon_encoder
    beacon_exchange
    beacon_hft
    Threads::Threads
)

# Link nlohmann_json if found
if(nlohmann_json_FOUND)
    target_link_libraries(generator PRIVATE nlohmann_json::nlohmann_json)
    message(STATUS "Found nlohmann_json package")
else()
    message(STATUS "nlohmann_json not found - install with: brew install nlohmann-json")
endif()

# Link beacon_exchange to beacon_encoder after both are created
target_link_libraries(beacon_encoder PUBLIC beacon_exchange)

# Compiler optimizations for HFT performance
target_compile_options(generator PRIVATE 
    -O3 
    -march=native 
    -mtune=native
    -flto
)

# Enable link-time optimization for maximum performance
set_target_properties(generator PROPERTIES
    INTERPROCEDURAL_OPTIMIZATION TRUE
)