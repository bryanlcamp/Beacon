cmake_minimum_required(VERSION 3.20)
project(ClientAlgorithm)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add local include directory
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Add common configuration directory for centralized configs
include_directories(${CMAKE_SOURCE_DIR}/src/apps/common)

# Add project-wide includes
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/vendor)
include_directories(${CMAKE_SOURCE_DIR}/vendor/nlohmann)

# Define source files with full paths
set(CLIENT_ALGO_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)
set(COMMON_SRC_DIR ${CMAKE_SOURCE_DIR}/src/apps/common)

# Debug: Print current paths for CI/CD troubleshooting
message(STATUS "Client Algorithm Source Dir: ${CLIENT_ALGO_SRC_DIR}")
message(STATUS "Common Source Dir: ${COMMON_SRC_DIR}")
message(STATUS "Current Source Dir: ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "Source Dir: ${CMAKE_SOURCE_DIR}")

# Check if common configuration exists
if(EXISTS ${COMMON_SRC_DIR}/configuration.cpp)
    set(COMMON_CONFIG_SRC ${COMMON_SRC_DIR}/configuration.cpp)
    message(STATUS "Found common configuration: ${COMMON_CONFIG_SRC}")
else()
    message(WARNING "Common configuration file not found at ${COMMON_SRC_DIR}/configuration.cpp")
    set(COMMON_CONFIG_SRC "")
endif()

# Super HFT Market Data Receiver (TCP + UDP) - Optimized for latency
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/MarketDataReceiver.cpp)
    add_executable(MarketDataReceiver ${CLIENT_ALGO_SRC_DIR}/MarketDataReceiver.cpp)
endif()

# Algorithm with order entry (OUCH protocol) - now with config support
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/ClientAlgorithm.cpp AND EXISTS ${CLIENT_ALGO_SRC_DIR}/ConfigProvider.cpp)
    add_executable(ClientAlgorithm 
        ${CLIENT_ALGO_SRC_DIR}/ClientAlgorithm.cpp
        ${CLIENT_ALGO_SRC_DIR}/ConfigProvider.cpp
        ${COMMON_CONFIG_SRC}
    )
endif()

# HFT threaded algorithm with production architecture
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/ClientAlgorithmHft.cpp)
    add_executable(ClientAlgorithmHft ${CLIENT_ALGO_SRC_DIR}/ClientAlgorithmHft.cpp)
endif()

# TWAP execution algorithm (industry-standard reference implementation)
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/AlgoTwap.cpp)
    add_executable(AlgoTwap ${CLIENT_ALGO_SRC_DIR}/AlgoTwap.cpp)
endif()

# Modern protocol-aware TWAP algorithm
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/AlgoTwapProtocol.cpp AND EXISTS ${CLIENT_ALGO_SRC_DIR}/TwapProtocolExecutor.cpp)
    add_executable(AlgoTwapProtocol
        ${CLIENT_ALGO_SRC_DIR}/AlgoTwapProtocol.cpp
        ${CLIENT_ALGO_SRC_DIR}/TwapProtocolExecutor.cpp
        ${COMMON_CONFIG_SRC}
    )
endif()

# Minimal template for developers to create their own algorithms
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/AlgoTemplate.cpp)
    add_executable(AlgoTemplate ${CLIENT_ALGO_SRC_DIR}/AlgoTemplate.cpp)
endif()

# Latency tracking example
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/ExampleLatencyTracking.cpp)
    add_executable(ExampleLatencyTracking ${CLIENT_ALGO_SRC_DIR}/ExampleLatencyTracking.cpp)
endif()

# Protocol test clients
if(EXISTS ${CLIENT_ALGO_SRC_DIR}/TestPillar.cpp)
    add_executable(TestPillar ${CLIENT_ALGO_SRC_DIR}/TestPillar.cpp)
endif()

if(EXISTS ${CLIENT_ALGO_SRC_DIR}/TestCme.cpp)
    add_executable(TestCme ${CLIENT_ALGO_SRC_DIR}/TestCme.cpp)
endif()

# Link pthread for threading support
find_package(Threads REQUIRED)

# Only link to targets that were actually created
if(TARGET ClientAlgorithm)
    target_link_libraries(ClientAlgorithm Threads::Threads)
endif()

if(TARGET ClientAlgorithmHft)
    target_link_libraries(ClientAlgorithmHft Threads::Threads)
endif()

if(TARGET AlgoTwap)
    target_link_libraries(AlgoTwap Threads::Threads)
endif()

if(TARGET AlgoTwapProtocol)
    target_link_libraries(AlgoTwapProtocol Threads::Threads)
endif()

if(TARGET AlgoTemplate)
    target_link_libraries(AlgoTemplate Threads::Threads)
endif()

if(TARGET MarketDataReceiver)
    target_link_libraries(MarketDataReceiver Threads::Threads)
endif()

if(TARGET ExampleLatencyTracking)
    target_link_libraries(ExampleLatencyTracking Threads::Threads)
endif()
