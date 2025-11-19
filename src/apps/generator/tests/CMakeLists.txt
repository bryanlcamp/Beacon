# =============================================================================
# Project:      Beacon Generator Tests
# Purpose:      CMake configuration for generator-specific unit tests
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.26)

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Determine paths
get_filename_component(GENERATOR_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/.." ABSOLUTE)
get_filename_component(BEACON_ROOT "${GENERATOR_ROOT}/../../.." ABSOLUTE)

# Include directories
include_directories(${BEACON_ROOT}/vendor/googletest/googletest/include)
include_directories(${BEACON_ROOT}/vendor/googletest/googlemock/include)
include_directories(${GENERATOR_ROOT}/include)
include_directories(${BEACON_ROOT}/src)
include_directories(${BEACON_ROOT}/vendor/nlohmann)

# Find required libraries
find_library(GTEST_LIB gtest PATHS ${BEACON_ROOT}/build/vendor/googletest/lib ${BEACON_ROOT}/build/lib)
find_library(GTEST_MAIN_LIB gtest_main PATHS ${BEACON_ROOT}/build/vendor/googletest/lib ${BEACON_ROOT}/build/lib)

if(NOT GTEST_LIB OR NOT GTEST_MAIN_LIB)
    message(WARNING "GoogleTest libraries not found. Building them...")
    
    # Add GoogleTest subdirectory if not already added
    if(NOT TARGET gtest)
        add_subdirectory(${BEACON_ROOT}/vendor/googletest ${CMAKE_CURRENT_BINARY_DIR}/googletest)
    endif()
    
    set(GTEST_LIB gtest)
    set(GTEST_MAIN_LIB gtest_main)
endif()

# Generator source files that we want to test
set(GENERATOR_SOURCES
    ${GENERATOR_ROOT}/src/ConfigProvider.cpp
    ${GENERATOR_ROOT}/src/ConfigFileParser.cpp
    ${GENERATOR_ROOT}/src/MessageGenerator.cpp
    ${GENERATOR_ROOT}/src/StatsManager.cpp
    ${GENERATOR_ROOT}/src/serializers/CsvSerializer.cpp
    ${GENERATOR_ROOT}/src/serializers/NsdqSerializer.cpp
    ${GENERATOR_ROOT}/src/serializers/CmeSerializer.cpp
    ${GENERATOR_ROOT}/src/serializers/NyseSerializer.cpp
)

# Test executable macro
macro(GeneratorTest test_name)
    add_executable(${test_name} ${ARGN})
    target_link_libraries(${test_name} ${GTEST_LIB} ${GTEST_MAIN_LIB} pthread)
    
    # Add the generator sources to the test
    target_sources(${test_name} PRIVATE ${GENERATOR_SOURCES})
    
    # Set working directory for tests to the generator directory
    set_target_properties(${test_name} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        WORKING_DIRECTORY ${GENERATOR_ROOT}
    )
    
    add_test(NAME ${test_name} COMMAND ${test_name} WORKING_DIRECTORY ${GENERATOR_ROOT})
endmacro()

# =============================================================================
# Generator Unit Tests
# =============================================================================

# ConfigProvider Tests
GeneratorTest(TestConfigProvider
    TestConfigProvider.cpp
)

# MessageGenerator Tests  
GeneratorTest(TestMessageGenerator
    TestMessageGenerator.cpp
)

# CsvSerializer Tests
GeneratorTest(TestCsvSerializer
    TestCsvSerializer.cpp
)

# StatsManager Tests
GeneratorTest(TestStatsManager
    TestStatsManager.cpp
)

# Integration test that tests the full pipeline
GeneratorTest(TestGeneratorIntegration
    TestGeneratorIntegration.cpp
)

# Enable testing
enable_testing()

# Custom target to run all generator tests
add_custom_target(RunGeneratorTests
    COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
    DEPENDS TestConfigProvider TestMessageGenerator TestCsvSerializer TestStatsManager TestGeneratorIntegration
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Running all generator unit tests"
)