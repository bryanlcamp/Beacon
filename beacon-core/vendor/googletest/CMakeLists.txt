cmake_minimum_required(VERSION 3.5)
project(googletest-distribution)
enable_testing()

# GoogleTest requires at least C++14
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Prevent overriding the parent project's compiler/linker
# settings on Windows
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

# Version information
set(GOOGLETEST_VERSION "1.15.2")

# Add googletest directories
add_subdirectory(googletest)
add_subdirectory(googlemock)

# Create aliases for the targets that projects expect
add_library(GTest::gtest ALIAS gtest)
add_library(GTest::gtest_main ALIAS gtest_main)
add_library(GTest::gmock ALIAS gmock)
add_library(GTest::gmock_main ALIAS gmock_main)
