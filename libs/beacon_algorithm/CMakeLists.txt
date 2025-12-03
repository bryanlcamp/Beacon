cmake_minimum_required(VERSION 3.20)

# Create the beacon_algorithm library
add_library(beacon_algorithm STATIC
    src/config_cache.cpp
    # src/algorithm_registry.cpp  # Add when file exists
)

# Set up include directories for this library
target_include_directories(beacon_algorithm PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Link against the 4 core beacon libraries
target_link_libraries(beacon_algorithm PUBLIC
    beacon::decoder      # Protocol decoders (renamed from beacon_exchange)
    beacon::hft         # HFT primitives (queues, threading, CPU optimizations)
    beacon::networking  # Network utilities
    nlohmann_json::nlohmann_json
)

target_compile_features(beacon_algorithm PUBLIC cxx_std_20)

# Algorithm-specific optimizations
if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" OR CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
    target_compile_options(beacon_algorithm PRIVATE
        -Wall -Wextra -Wpedantic
        -O3 -march=native -mtune=native
    )
endif()

add_library(beacon::algorithm ALIAS beacon_algorithm)

message(STATUS "Beacon Algorithm library configured (4-library architecture)")
