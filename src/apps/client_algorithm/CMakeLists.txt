cmake_minimum_required(VERSION 3.26)
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

# Super HFT Market Data Receiver (TCP + UDP) - Optimized for latency
add_executable(MarketDataReceiver src/MarketDataReceiver.cpp)

# Algorithm with order entry (OUCH protocol) - now with config support
add_executable(ClientAlgorithm 
    src/ClientAlgorithm.cpp
    src/ConfigProvider.cpp
    ${CMAKE_SOURCE_DIR}/src/apps/common/configuration.cpp
)

# HFT threaded algorithm with production architecture
add_executable(ClientAlgorithmHft
    src/ClientAlgorithmHft.cpp
)

# TWAP execution algorithm (industry-standard reference implementation)
add_executable(AlgoTwap
    src/AlgoTwap.cpp
)

# Modern protocol-aware TWAP algorithm
add_executable(AlgoTwapProtocol
    src/AlgoTwapProtocol.cpp
    src/TwapProtocolExecutor.cpp
    ${CMAKE_SOURCE_DIR}/src/apps/common/configuration.cpp
)

# Minimal template for developers to create their own algorithms
add_executable(AlgoTemplate
    src/AlgoTemplate.cpp
)

# Latency tracking example
add_executable(ExampleLatencyTracking
    src/ExampleLatencyTracking.cpp
)

# Protocol test clients
add_executable(TestPillar src/TestPillar.cpp)
add_executable(TestCme src/TestCme.cpp)

# Link pthread for threading support
find_package(Threads REQUIRED)
target_link_libraries(ClientAlgorithm Threads::Threads)
target_link_libraries(ClientAlgorithmHft Threads::Threads)
target_link_libraries(AlgoTwap Threads::Threads)
target_link_libraries(AlgoTwapProtocol Threads::Threads)
target_link_libraries(AlgoTemplate Threads::Threads)
