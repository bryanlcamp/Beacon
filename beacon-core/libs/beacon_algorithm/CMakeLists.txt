# beacon_algorithm library
cmake_minimum_required(VERSION 3.16)

add_library(beacon_algorithm STATIC
    src/config_cache.cpp
)

target_include_directories(beacon_algorithm PUBLIC
    include
)

target_link_libraries(beacon_algorithm PRIVATE
    beacon_hft
)
