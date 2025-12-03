# =============================================================================
# Project:      Beacon
# Purpose:      Common networking library for HFT applications
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.20)

# Create the beacon_networking library
add_library(beacon_networking STATIC
    src/tcp_client.cpp
    src/tcp_server.cpp
    src/udp_client.cpp
    src/multicast_receiver.cpp
    src/network_utils.cpp
)

# Set include directories
target_include_directories(beacon_networking PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Set C++ standard
target_compile_features(beacon_networking PUBLIC cxx_std_20)

# Compiler-specific optimizations for networking
if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" OR CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
    target_compile_options(beacon_networking PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        -O3
        -march=native
    )
elseif(CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
    target_compile_options(beacon_networking PRIVATE
        /W4
        /O2
        /arch:AVX2
    )
endif()

# Add alias for easier linking
add_library(beacon::networking ALIAS beacon_networking)

message(STATUS "Beacon Networking library configured")
