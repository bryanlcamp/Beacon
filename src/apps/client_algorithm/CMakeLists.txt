# =============================================================================
# BEACON CLIENT ALGORITHM CMAKE - C++20 SYSTEM VERSION
# Version: v4.1 - Updated for C++20 consistency
# Date: 2025-11-19
# =============================================================================


cmake_minimum_required(VERSION 3.20)
project(ClientAlgorithm_v4)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

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

# Force cache invalidation
set(CMAKE_CACHE_VERSION "v4.1_cpp20_system")
message(STATUS "🚀 CLIENT ALGORITHM CMAKE v4.1 - C++20 SYSTEM 🚀")

# Determine the Beacon root directory (SAME AS GENERATOR)
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    # Standalone build
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    # Part of larger build
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# Add include directories for the 4-library architecture
include_directories(
    ${BEACON_ROOT}/libs/beacon_hft/include
    ${BEACON_ROOT}/libs/beacon_algorithm/include  
    ${BEACON_ROOT}/libs/beacon_decoder/include
    ${BEACON_ROOT}/libs/beacon_networking/include
    ${BEACON_ROOT}/vendor/nlohmann/include  # Use vendor directory instead of find_package
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Collect source files
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Create executables for each source file
foreach(SOURCE ${SOURCES})
    get_filename_component(EXEC_NAME ${SOURCE} NAME_WE)
    add_executable(${EXEC_NAME} ${SOURCE})
    
    # Link libraries - removed nlohmann_json since it's header-only from vendor
    target_link_libraries(${EXEC_NAME} 
        Threads::Threads
    )
    
    # Set C++20 features
    target_compile_features(${EXEC_NAME} PRIVATE cxx_std_20)
    
    message(STATUS "Created executable: ${EXEC_NAME}")
endforeach()

# Find pthread
find_package(Threads REQUIRED)

message(STATUS "🎯 CLIENT ALGORITHM CMAKE v4.1 C++20 CONFIGURATION COMPLETE 🎯")