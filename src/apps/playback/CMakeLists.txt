# =============================================================================
# Project:      Beacon
# Application:  playback
# Purpose:      Build configuration for the market data playback application.
# Author:       Bryan Camp
# =============================================================================


cmake_minimum_required(VERSION 3.20)
project(playback LANGUAGES CXX)


# --- Robust root detection for shared scripts ---
set(_beacon_root_candidates
    "${CMAKE_SOURCE_DIR}"
    "${CMAKE_CURRENT_SOURCE_DIR}/../../.."
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../.."
)
set(_beacon_root_found "")
foreach(_cand IN LISTS _beacon_root_candidates)
    if(EXISTS "${_cand}/scripts/build-common.cmake")
        set(_beacon_root_found "${_cand}")
        break()
    endif()
endforeach()
if(NOT _beacon_root_found)
    message(FATAL_ERROR "Could not locate Beacon project root for shared scripts!")
endif()
set(BEACON_ROOT "${_beacon_root_found}")

# Shared build logic (robust to invocation dir)
include(${BEACON_ROOT}/scripts/build-common.cmake)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    include(${BEACON_ROOT}/scripts/build/build-common-debug.cmake)
elseif(CMAKE_BUILD_TYPE STREQUAL "Release")
    include(${BEACON_ROOT}/scripts/build-common-release.cmake)
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Note: This app can be built two ways:
# (1) As a standalone executable. 
# (2) With a larger Beacon build of other executables.
# 
# Regardless, we need to know the root of the repo for:
# vendor, config, etc.
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    # This is a standalone build. Adjust the REPO root.
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    # This is part of a larger Beacon build.
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# Collect sources - UNIFIED WITH EXCHANGES LIBRARY (no more scattered serializers)
file(GLOB PLAYBACK_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/main.cpp
    
    # REMOVED ALL SCATTERED SERIALIZERS - now using unified exchanges library
    # OLD FILES DELETED:
    # src/serializers/ItchDeserializer.cpp   <- DELETED - now in libs/exchanges
    # src/serializers/CmeDeserializer.cpp    <- DELETED - now in libs/exchanges
    # src/serializers/NyseDeserializer.cpp   <- DELETED - now in libs/exchanges
)

add_executable(playback ${PLAYBACK_SOURCES})

target_include_directories(playback PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/interfaces
    ${BEACON_ROOT}/include
    ${BEACON_ROOT}/src/libs                        # NEW: Unified exchanges library  
    ${BEACON_ROOT}/src/libs/exchange_protocols     # NEW: Exchange protocols root (protocol_common.h)
    ${BEACON_ROOT}/src/libs/exchange_protocols/include  # NEW: Exchanges headers  
    ${BEACON_ROOT}/vendor
    ${BEACON_ROOT}/src/apps/common
)

# Link against NEW UNIFIED EXCHANGES LIBRARY
target_link_libraries(playback PRIVATE
    beacon_exchanges             # NEW: Our unified exchanges library
    beacon_utils                 # Existing utilities
)

# Enable warnings
if (CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
    target_compile_options(playback PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Add playbook tests (DISABLED - gtest issues)
# add_subdirectory(tests)