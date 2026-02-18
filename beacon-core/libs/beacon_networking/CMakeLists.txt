# beacon_networking library
cmake_minimum_required(VERSION 3.16)

add_library(beacon_networking STATIC
    src/tcp_client.cpp
)

target_include_directories(beacon_networking PUBLIC
    include
)
