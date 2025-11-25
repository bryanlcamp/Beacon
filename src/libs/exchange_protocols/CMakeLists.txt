cmake_minimum_required(VERSION 3.20)
project(beacon_exchanges LANGUAGES CXX)

add_library(beacon_exchanges INTERFACE)

target_include_directories(beacon_exchanges INTERFACE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/libs
)

target_compile_features(beacon_exchanges INTERFACE cxx_std_20)