# =============================================================================
# Project:      Beacon
# Purpose:      Root build configuration for the Beacon project
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.20)

# Debug: Print CMake and system information
message(STATUS "CMake version: ${CMAKE_VERSION}")
message(STATUS "System: ${CMAKE_SYSTEM}")
message(STATUS "Processor: ${CMAKE_SYSTEM_PROCESSOR}")

project(Beacon LANGUAGES CXX)

# Set C++ standard for the entire project - try C++17 for better compatibility
if(NOT DEFINED CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 17)
endif()
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_EXTENSIONS OFF)

# Debug: Print compiler information
message(STATUS "CXX Compiler: ${CMAKE_CXX_COMPILER}")
message(STATUS "CXX Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")

# Add vendor directory to include paths for the entire project
include_directories(${CMAKE_SOURCE_DIR}/vendor)
include_directories(${CMAKE_SOURCE_DIR}/vendor/nlohmann)
include_directories(${CMAKE_SOURCE_DIR}/include)

# Add shared include directory for all targets
include_directories(${PROJECT_SOURCE_DIR}/include)

# Add common configuration directory for all applications
include_directories(${PROJECT_SOURCE_DIR}/src/apps/common)

include_directories(
  ${CMAKE_SOURCE_DIR}/src
  ${CMAKE_SOURCE_DIR}/config/playback
  ${CMAKE_SOURCE_DIR}/src/apps/playback
  ${CMAKE_SOURCE_DIR}/src/apps/playbook/message_senders
  ${CMAKE_SOURCE_DIR}/src/apps/playbook/playbook_advisors
  ${CMAKE_SOURCE_DIR}/src/apps/playbook/playbook_authorities,
  ${CMAKE_SOURCE_DIR}/src/apps/playbook/playbook_types
)

# Create a static library for shared utilities
add_library(beacon_utils STATIC
    include/utils/string_utils.cpp
)

target_include_directories(beacon_utils PUBLIC ${PROJECT_SOURCE_DIR}/include)

# Add subdirectories for libraries - with error handling
if(EXISTS ${CMAKE_SOURCE_DIR}/src/libs/exchange_protocols/CMakeLists.txt)
    add_subdirectory(src/libs/exchange_protocols)
    message(STATUS "Added exchange_protocols")
else()
    message(WARNING "Skipping exchange_protocols - CMakeLists.txt not found")
endif()

# Add subdirectories for applications - with error handling  
if(EXISTS ${CMAKE_SOURCE_DIR}/src/apps/generator/CMakeLists.txt)
    add_subdirectory(src/apps/generator)
    message(STATUS "Added generator")
else()
    message(WARNING "Skipping generator - CMakeLists.txt not found")
endif()

if(EXISTS ${CMAKE_SOURCE_DIR}/src/apps/playback/CMakeLists.txt)
    add_subdirectory(src/apps/playback)
    message(STATUS "Added playback")
else()
    message(WARNING "Skipping playback - CMakeLists.txt not found")
endif()

if(EXISTS ${CMAKE_SOURCE_DIR}/src/apps/matching_engine/CMakeLists.txt)
    add_subdirectory(src/apps/matching_engine)
    message(STATUS "Added matching_engine")
else()
    message(WARNING "Skipping matching_engine - CMakeLists.txt not found")
endif()

if(EXISTS ${CMAKE_SOURCE_DIR}/src/apps/client_algorithm/CMakeLists.txt)
    add_subdirectory(src/apps/client_algorithm)
    message(STATUS "Added client_algorithm")
else()
    message(WARNING "Skipping client_algorithm - CMakeLists.txt not found")
endif()

# Enable testing - with error handling and CI/CD option
option(BUILD_TESTING "Build the testing tree" ON)

if(BUILD_TESTING)
    enable_testing()
    
    # Optional: Add GoogleTest if tests directory exists and has CMakeLists.txt
    if(EXISTS "${CMAKE_SOURCE_DIR}/tests/CMakeLists.txt")
        if(EXISTS "${CMAKE_SOURCE_DIR}/vendor/googletest/CMakeLists.txt")
            add_subdirectory(vendor/googletest)
            add_subdirectory(tests)
            message(STATUS "Added tests and googletest")
        else()
            message(WARNING "Skipping tests - GoogleTest not found")
        endif()
    else()
        message(WARNING "Skipping tests - tests/CMakeLists.txt not found")
    endif()
else()
    message(STATUS "Testing disabled (BUILD_TESTING=OFF)")
endif()