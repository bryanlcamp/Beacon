cmake_minimum_required(VERSION 3.16)
project(beacon_tests)

set(CMAKE_CXX_STANDARD 20)

# Use GoogleTest from vendor directory
# GoogleTest is built as part of the main build system

# Include beacon libraries
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/libs)

# Core tests
add_executable(test_latency_tracker
    core/test_latency_tracker.cpp
)
target_link_libraries(test_latency_tracker
    beacon_hft
    gtest_main
)

add_executable(test_ringbuffer
    core/test_ringbuffer.cpp
)
target_link_libraries(test_ringbuffer
    beacon_hft
    gtest_main
)

# Algorithm tests
add_executable(test_strategy_logic
    algorithm/test_strategy_logic.cpp
)
target_link_libraries(test_strategy_logic
    beacon_algorithm
    gtest_main
)

# Integration tests
add_executable(test_tick_to_trade
    integration/test_tick_to_trade.cpp
)
target_link_libraries(test_tick_to_trade
    beacon_hft
    beacon_algorithm
    beacon_networking
    gtest_main
)

# Enable testing
enable_testing()
gtest_discover_tests(test_latency_tracker)
gtest_discover_tests(test_ringbuffer)
gtest_discover_tests(test_strategy_logic)
gtest_discover_tests(test_tick_to_trade)
