# =============================================================================
# Project:      Beacon
# Application:  playback
# Purpose:      Test configuration for the market data playback application.
#               Follows the same structure as generator tests.
# Author:       Bryan Camp
# =============================================================================

cmake_minimum_required(VERSION 3.20)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Define macro for creating playback tests
macro(PlaybackTest test_name)
    add_executable(${test_name}
        ${test_name}.cpp
    )
    
    target_include_directories(${test_name} PRIVATE
        ${BEACON_ROOT}/vendor/googletest/googletest/include
        ${BEACON_ROOT}/include
        ${BEACON_ROOT}/libs
        ${CMAKE_CURRENT_SOURCE_DIR}/..
        ${CMAKE_CURRENT_SOURCE_DIR}/../src
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/interfaces
        ${BEACON_ROOT}/vendor/nlohmann
    )
    
    target_link_libraries(${test_name} 
        gtest 
        gtest_main
        beacon_exchanges  # NEW: Unified exchanges library
    )
    
    # Copy test data files to build directory (if they exist)
    if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/TestValidConfig.json)
        configure_file(${CMAKE_CURRENT_SOURCE_DIR}/TestValidConfig.json 
                       ${CMAKE_CURRENT_BINARY_DIR}/TestValidConfig.json COPYONLY)
    endif()
    if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/TestMinimalConfig.json)
        configure_file(${CMAKE_CURRENT_SOURCE_DIR}/TestMinimalConfig.json 
                       ${CMAKE_CURRENT_BINARY_DIR}/TestMinimalConfig.json COPYONLY)
    endif()
    if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/test_sample.bin)
        configure_file(${CMAKE_CURRENT_SOURCE_DIR}/test_sample.bin 
                       ${CMAKE_CURRENT_BINARY_DIR}/test_sample.bin COPYONLY)
    endif()
    
    # Register with CTest
    add_test(NAME ${test_name} COMMAND ${test_name})
    
    # Set test properties
    set_tests_properties(${test_name} PROPERTIES
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        TIMEOUT 60
    )
endmacro()

# Create playback tests
PlaybackTest(TestBinaryInputFileReader)
PlaybackTest(TestUdpReplayer)
PlaybackTest(TestRulesEngine)
PlaybackTest(TestPlaybackState)
PlaybackTest(TestPlaybackIntegration)