cmake_minimum_required(VERSION 3.20)
project(matching_engine)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Determine the Beacon root directory (SAME AS GENERATOR)
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    # Standalone build
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    # Part of larger build
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# Add includes with proper BEACON_ROOT
include_directories(${BEACON_ROOT}/src/apps/common)
include_directories(${BEACON_ROOT}/include)
include_directories(${BEACON_ROOT}/libs)
include_directories(${BEACON_ROOT}/vendor)
include_directories(${BEACON_ROOT}/vendor/nlohmann)

# Main executable
add_executable(matching_engine 
    main.cpp
    ${BEACON_ROOT}/src/apps/common/configuration.cpp
)

# Link pthread for threading support
find_package(Threads REQUIRED)
target_link_libraries(matching_engine 
    Threads::Threads
    # beacon_exchanges  # Commented out - library doesn't exist
)
