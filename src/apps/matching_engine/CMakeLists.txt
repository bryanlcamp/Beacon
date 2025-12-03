
cmake_minimum_required(VERSION 3.20)
project(matching_engine)

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

# Determine the Beacon root directory
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# App-specific includes
include_directories(${BEACON_ROOT}/src/apps/common)
include_directories(${BEACON_ROOT}/include)
include_directories(${BEACON_ROOT}/libs)
include_directories(${BEACON_ROOT}/vendor)
include_directories(${BEACON_ROOT}/vendor/nlohmann)

# Main executable using shared macro
beacon_add_app(matching_engine
    main.cpp
    ${BEACON_ROOT}/src/apps/common/configuration.cpp
)

# Link libraries
find_package(Threads REQUIRED)
target_link_libraries(matching_engine 
    Threads::Threads
    exchange_protocols
)
