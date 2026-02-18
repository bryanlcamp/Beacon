cmake_minimum_required(VERSION 3.5)
project(googlemock CXX)

# Define the gmock library
add_library(gmock STATIC
    src/gmock-all.cc
)

target_include_directories(gmock PUBLIC
    include
    ../googletest/include
    .
)

target_link_libraries(gmock gtest)

# Define the gmock_main library
add_library(gmock_main STATIC
    src/gmock_main.cc
)

target_link_libraries(gmock_main gmock gtest)
