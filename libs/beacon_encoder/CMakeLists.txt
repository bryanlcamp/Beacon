cmake_minimum_required(VERSION 3.20)
project(beacon_encoder)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories - beacon_exchange will be handled by parent CMakeLists
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../beacon_exchange/include
)

# Collect all source files from organized structure
file(GLOB_RECURSE ENCODER_SOURCES 
    "src/nasdaq/*.cpp"
    "src/cme/*.cpp" 
    "src/nyse/*.cpp"
)

# Create the encoder library
add_library(beacon_encoder STATIC ${ENCODER_SOURCES})

# Don't add_subdirectory here - let the parent handle beacon_exchange
# The generator CMakeLists.txt will handle the dependency order

# Performance optimizations for HFT
target_compile_options(beacon_encoder PRIVATE
    -O3
    -march=native
    -mtune=native
    -flto
)

# Export include directories
target_include_directories(beacon_encoder PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Set target properties
set_target_properties(beacon_encoder PROPERTIES
    INTERPROCEDURAL_OPTIMIZATION TRUE
)
