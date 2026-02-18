cmake_minimum_required(VERSION 3.5)
project(googletest CXX C)

# Define the gtest library
add_library(gtest STATIC
    src/gtest-all.cc
)

target_include_directories(gtest PUBLIC
    include
    .
)

# Define the gtest_main library
add_library(gtest_main STATIC
    src/gtest_main.cc
)

target_link_libraries(gtest_main gtest)

# Compiler-specific options
if(CMAKE_CXX_COMPILER_ID MATCHES "MSVC")
    target_compile_definitions(gtest PRIVATE _SILENCE_STDEXT_HASH_DEPRECATION_WARNINGS)
endif()

# Threading
find_package(Threads REQUIRED)
if(Threads_FOUND)
    target_link_libraries(gtest ${CMAKE_THREAD_LIBS_INIT})
endif()
