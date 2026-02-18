# beacon_exchange library
cmake_minimum_required(VERSION 3.16)

add_library(beacon_exchange STATIC)

target_include_directories(beacon_exchange PUBLIC
    include
    protocols
)
