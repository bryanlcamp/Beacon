# =============================================================================
# Project:      Beacon
# Purpose:      Unified exchanges library build configuration
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.20)

# Create the beacon_exchanges library - REPLACES ALL SCATTERED SERIALIZERS  
add_library(beacon_exchanges STATIC
    # Core serialization interfaces
    src/BaseSerializer.cpp
    src/SerializerFactory.cpp
    
    # Market data protocol implementations
    src/NasdaqItchSerializer.cpp
    src/CmeMdpSerializer.cpp 
    src/NysePillarSerializer.cpp
    
    # Execution data protocol implementations
    src/NasdaqOuchSerializer.cpp
    src/CmeILinkSerializer.cpp
    
    # Protocol detection and auto-detection
    src/detection/ProtocolDetector.cpp
)

# Set include directories for the beacon_exchanges library
target_include_directories(beacon_exchanges PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Set C++ standard for this library
target_compile_features(beacon_exchanges PUBLIC cxx_std_17)

# Link against beacon_utils if it exists
if(TARGET beacon_utils)
    target_link_libraries(beacon_exchanges PUBLIC beacon_utils)
endif()

# Compiler-specific optimizations
if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" OR CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
    target_compile_options(beacon_exchanges PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        -O3
        -march=native
    )
elseif(CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
    target_compile_options(beacon_exchanges PRIVATE
        /W4
        /O2
        /arch:AVX2
    )
endif()

# Add alias for easier linking
add_library(beacon::exchanges ALIAS beacon_exchanges)

message(STATUS "Beacon Exchanges library configured - UNIFIED SERIALIZATION READY")