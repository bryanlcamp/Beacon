# =============================================================================
# Project:      Beacon
# Application:  generator
# Purpose:      Build configuration for the generator application.
# Author:       Bryan Camp
# =============================================================================

# Minimum CMake version
cmake_minimum_required(VERSION 3.20)

# Project name
project(generator)

# Set the C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Determine the Beacon root directory
# If this is a standalone build, we need to go up 3 levels: app -> apps -> src -> experimental
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    # Standalone build
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    # Part of larger build
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# Add the executable target
add_executable(generator
    src/main.cpp
    src/ConfigProvider.cpp
    src/MessageGenerator.cpp
    src/StatsManager.cpp
    src/serializers/CmeSerializer.cpp    
    src/serializers/ItchSerializer.cpp
    src/serializers/NsdqSerializer.cpp
    src/serializers/NyseSerializer.cpp
    src/serializers/CsvSerializer.cpp
    src/ConfigFileParser.cpp
    # src/ConfigFileValidator.cpp  # TODO: Update for PascalCase schema
)

# Include directories relative to the Beacon root
target_include_directories(generator PRIVATE
    ${BEACON_ROOT}/vendor
    ${BEACON_ROOT}/src/libs/exchange_protocols
    ${BEACON_ROOT}/src/apps/common
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Debug: Print the BEACON_ROOT to verify it's correct
message(STATUS "BEACON_ROOT is: ${BEACON_ROOT}")
message(STATUS "Looking for nlohmann at: ${BEACON_ROOT}/vendor/nlohmann/")

# Link any required libraries (if applicable)
# Example: target_link_libraries(exchange_market_data_generator <library_name>)

# Debug build options
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    # Extra warnings
    add_compile_options(-Wall -Wextra -Wpedantic)
    # Disable optimizations
    add_compile_options(-O0)
    # Enable sanitizers (address and undefined)
    add_compile_options(-fsanitize=address,undefined)
    # Enable static analysis (clang-tidy if available)
    set(CMAKE_CXX_CLANG_TIDY "clang-tidy;-quiet")
    # Generate compile_commands.json for IDEs and external tools
    set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
endif()