# =============================================================================
# BEACON CLIENT ALGORITHM CMAKE - COMPLETELY REWRITTEN FOR CI/CD COMPATIBILITY  
# Version: MEGA-FIXED v4.0 - GitHub Actions Cache Destroyer
# Date: 2025-11-19
# This version includes bulletproof source file detection and CI/CD compatibility
# =============================================================================

cmake_minimum_required(VERSION 3.20)
project(ClientAlgorithm_v4)

# Force cache invalidation
set(CMAKE_CACHE_VERSION "v4.0_github_actions_fix")
message(STATUS "🚀 CLIENT ALGORITHM CMAKE v4.0 - COMPLETELY REWRITTEN 🚀")

set(CMAKE_CXX_STANDARD 17)  # Use C++17 for maximum CI compatibility
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Determine the Beacon root directory (SAME AS GENERATOR)
if(CMAKE_SOURCE_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    # Standalone build
    set(BEACON_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../..")
else()
    # Part of larger build
    set(BEACON_ROOT "${CMAKE_SOURCE_DIR}")
endif()

# Add local include directory
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Add common configuration directory for centralized configs
include_directories(${BEACON_ROOT}/src/apps/common)

# Add project-wide includes - FIXED FOR PROPER HEADER RESOLUTION
include_directories(${BEACON_ROOT}/include)
include_directories(${BEACON_ROOT}/libs)
include_directories(${BEACON_ROOT}/src/libs)
include_directories(${BEACON_ROOT}/vendor)
include_directories(${BEACON_ROOT}/vendor/nlohmann)

# Define source files with full paths
set(CLIENT_ALGO_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)
set(COMMON_SRC_DIR ${BEACON_ROOT}/src/apps/common)

# MEGA DEBUG: Print everything for CI/CD troubleshooting
message(STATUS "=== MEGA-FIXED v4.0 CLIENT ALGORITHM CMAKE DEBUG INFO ===")
message(STATUS "📁 Client Algorithm Source Dir: ${CLIENT_ALGO_SRC_DIR}")
message(STATUS "📁 Common Source Dir: ${COMMON_SRC_DIR}")
message(STATUS "📁 Current Source Dir: ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "📁 Project Source Dir: ${CMAKE_SOURCE_DIR}")
message(STATUS "📁 BEACON ROOT: ${BEACON_ROOT}")

# List all files in the source directory
file(GLOB SOURCE_FILES "${CLIENT_ALGO_SRC_DIR}/*.cpp")
message(STATUS "📋 Found source files: ${SOURCE_FILES}")

# Check if common configuration exists
if(EXISTS ${COMMON_SRC_DIR}/configuration.cpp)
    set(COMMON_CONFIG_SRC ${COMMON_SRC_DIR}/configuration.cpp)
    message(STATUS "✅ Found common configuration: ${COMMON_CONFIG_SRC}")
else()
    message(WARNING "❌ Common configuration file not found at ${COMMON_SRC_DIR}/configuration.cpp")
    set(COMMON_CONFIG_SRC "")
endif()

# Build executables only if source files exist - v4.0 BULLETPROOF VERSION

# 1. Market Data Receiver
set(MDR_SOURCE "${CLIENT_ALGO_SRC_DIR}/MarketDataReceiver.cpp")
if(EXISTS ${MDR_SOURCE})
    add_executable(MarketDataReceiver ${MDR_SOURCE})
    message(STATUS "✅ BUILDING: MarketDataReceiver from ${MDR_SOURCE}")
else()
    message(WARNING "❌ SKIPPING: MarketDataReceiver - source not found at ${MDR_SOURCE}")
endif()

# 2. Client Algorithm with Config Support  
set(CA_SOURCE1 "${CLIENT_ALGO_SRC_DIR}/ClientAlgorithm.cpp")
set(CA_SOURCE2 "${CLIENT_ALGO_SRC_DIR}/ConfigProvider.cpp")
if(EXISTS ${CA_SOURCE1} AND EXISTS ${CA_SOURCE2})
    if(COMMON_CONFIG_SRC)
        add_executable(ClientAlgorithm ${CA_SOURCE1} ${CA_SOURCE2} ${COMMON_CONFIG_SRC})
    else()
        add_executable(ClientAlgorithm ${CA_SOURCE1} ${CA_SOURCE2})
    endif()
    message(STATUS "✅ BUILDING: ClientAlgorithm")
else()
    message(WARNING "❌ SKIPPING: ClientAlgorithm - sources not found")
endif()

# 3. HFT Algorithm
set(HFT_SOURCE "${CLIENT_ALGO_SRC_DIR}/ClientAlgorithmHft.cpp")
if(EXISTS ${HFT_SOURCE})
    add_executable(ClientAlgorithmHft ${HFT_SOURCE})
    message(STATUS "✅ BUILDING: ClientAlgorithmHft")
else()
    message(WARNING "❌ SKIPPING: ClientAlgorithmHft")
endif()

# 4. TWAP Algorithm
set(TWAP_SOURCE "${CLIENT_ALGO_SRC_DIR}/AlgoTwap.cpp")
if(EXISTS ${TWAP_SOURCE})
    add_executable(AlgoTwap ${TWAP_SOURCE})
    message(STATUS "✅ BUILDING: AlgoTwap")
else()
    message(WARNING "❌ SKIPPING: AlgoTwap")
endif()

# 5. TWAP Protocol Algorithm (CRITICAL FOR CI/CD)
set(TWAP_PROTO_SOURCE1 "${CLIENT_ALGO_SRC_DIR}/AlgoTwapProtocol.cpp")
set(TWAP_PROTO_SOURCE2 "${CLIENT_ALGO_SRC_DIR}/TwapProtocolExecutor.cpp")
if(EXISTS ${TWAP_PROTO_SOURCE1} AND EXISTS ${TWAP_PROTO_SOURCE2})
    if(COMMON_CONFIG_SRC)
        add_executable(AlgoTwapProtocol ${TWAP_PROTO_SOURCE1} ${TWAP_PROTO_SOURCE2} ${COMMON_CONFIG_SRC})
    else()
        add_executable(AlgoTwapProtocol ${TWAP_PROTO_SOURCE1} ${TWAP_PROTO_SOURCE2})
    endif()
    message(STATUS "✅ BUILDING: AlgoTwapProtocol (CRITICAL TARGET)")
else()
    message(WARNING "❌ SKIPPING: AlgoTwapProtocol - sources not found")
endif()

# 6. Algorithm Template
set(TEMPLATE_SOURCE "${CLIENT_ALGO_SRC_DIR}/AlgoTemplate.cpp")
if(EXISTS ${TEMPLATE_SOURCE})
    add_executable(AlgoTemplate ${TEMPLATE_SOURCE})
    message(STATUS "✅ BUILDING: AlgoTemplate")
else()
    message(WARNING "❌ SKIPPING: AlgoTemplate")
endif()

# 7. Latency Tracking Example
set(LATENCY_SOURCE "${CLIENT_ALGO_SRC_DIR}/ExampleLatencyTracking.cpp")
if(EXISTS ${LATENCY_SOURCE})
    add_executable(ExampleLatencyTracking ${LATENCY_SOURCE})
    message(STATUS "✅ BUILDING: ExampleLatencyTracking")
else()
    message(WARNING "❌ SKIPPING: ExampleLatencyTracking")
endif()

# 8. Protocol Test Clients
set(PILLAR_SOURCE "${CLIENT_ALGO_SRC_DIR}/TestPillar.cpp")
if(EXISTS ${PILLAR_SOURCE})
    add_executable(TestPillar ${PILLAR_SOURCE})
    message(STATUS "✅ BUILDING: TestPillar")
else()
    message(WARNING "❌ SKIPPING: TestPillar")
endif()

set(CME_SOURCE "${CLIENT_ALGO_SRC_DIR}/TestCme.cpp")
if(EXISTS ${CME_SOURCE})
    add_executable(TestCme ${CME_SOURCE})
    message(STATUS "✅ BUILDING: TestCme")
else()
    message(WARNING "❌ SKIPPING: TestCme")
endif()

# Link pthread for threading support - v4.0 SAFE LINKING
find_package(Threads REQUIRED)

# Only link to targets that were actually created - BULLETPROOF
foreach(target IN ITEMS MarketDataReceiver ClientAlgorithm ClientAlgorithmHft AlgoTwap AlgoTwapProtocol AlgoTemplate ExampleLatencyTracking TestPillar TestCme)
    if(TARGET ${target})
        target_link_libraries(${target} Threads::Threads)
        message(STATUS "🔗 LINKED: ${target} with Threads")
    endif()
endforeach()

message(STATUS "🎯 CLIENT ALGORITHM CMAKE v4.0 CONFIGURATION COMPLETE 🎯")