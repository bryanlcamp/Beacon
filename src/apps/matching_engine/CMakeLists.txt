cmake_minimum_required(VERSION 3.26)
project(matching_engine)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add common configuration directory for centralized configs
include_directories(${CMAKE_SOURCE_DIR}/src/apps/common)
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/vendor)
include_directories(${CMAKE_SOURCE_DIR}/vendor/nlohmann)

# Main executable
add_executable(matching_engine 
    main.cpp
    ${CMAKE_SOURCE_DIR}/src/apps/common/configuration.cpp
)

# Link pthread for threading support
find_package(Threads REQUIRED)
target_link_libraries(matching_engine Threads::Threads)
