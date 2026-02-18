cmake_minimum_required(VERSION 3.16)
project(beacon_client_algorithm)

set(CMAKE_CXX_STANDARD 20)

# Include beacon libraries
find_package(beacon_hft REQUIRED)
find_package(beacon_algorithm REQUIRED)

add_executable(beacon_client_algorithm
    src/main.cpp
    src/ConfigProvider.cpp
    src/ExampleLatencyTracking.cpp
    src/MarketDataReceiver.cpp
)

target_include_directories(beacon_client_algorithm PRIVATE
    include
    ${CMAKE_SOURCE_DIR}/include
)

target_link_libraries(beacon_client_algorithm
    beacon_algorithm
    beacon_hft
    beacon_networking
)
