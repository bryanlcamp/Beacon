cmake_minimum_required(VERSION 3.20)
project(beacon_hft)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required threading for PinnedThread
find_package(Threads REQUIRED)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Check what source files actually exist and collect them manually
# This is more reliable than GLOB_RECURSE for header-only or sparse libraries
set(HFT_SOURCES "")

# Check for actual source files in your beacon_hft structure
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/src")
    file(GLOB_RECURSE FOUND_SOURCES 
        "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp"
    )
    list(APPEND HFT_SOURCES ${FOUND_SOURCES})
endif()

# Debug: Print what sources were found
message(STATUS "Found HFT sources: ${HFT_SOURCES}")

# If no source files found, create a header-only library
if(NOT HFT_SOURCES)
    # Create header-only interface library
    add_library(beacon_hft INTERFACE)
    
    # Link threading for header-only library
    target_link_libraries(beacon_hft INTERFACE Threads::Threads)
    
    # Export include directories for header-only
    target_include_directories(beacon_hft INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    )
    
    message(STATUS "Beacon HFT configured as header-only library")
else()
    # Create normal library with source files
    add_library(beacon_hft STATIC ${HFT_SOURCES})
    
    # Link threading for regular library
    target_link_libraries(beacon_hft PUBLIC Threads::Threads)
    
    # Performance optimizations for HFT
    target_compile_options(beacon_hft PRIVATE
        -O3
        -march=native
        -mtune=native
        -flto
    )
    
    # Export include directories
    target_include_directories(beacon_hft PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    )
    
    # Set target properties
    set_target_properties(beacon_hft PROPERTIES
        INTERPROCEDURAL_OPTIMIZATION TRUE
    )
    
    message(STATUS "Beacon HFT configured with ${CMAKE_LIST_LENGTH;HFT_SOURCES} source files")
endif()

message(STATUS "Beacon HFT library configured with maximum performance optimizations")
