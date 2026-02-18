# Vendor Dependencies

This directory contains third-party dependencies for the Beacon trading platform.

## Contents

### nlohmann/
**JSON for Modern C++** - Header-only JSON library
- **File**: `json.hpp`
- **Purpose**: Configuration parsing, API communication, logging
- **Usage**: `#include <nlohmann/json.hpp>`
- **Version**: Latest (header-only library)
- **License**: MIT
- **Homepage**: https://github.com/nlohmann/json

**Example Usage:**
```cpp
#include <nlohmann/json.hpp>
using json = nlohmann::json;

// Parse configuration
json config = json::parse(config_file_content);
std::string algorithm = config["algorithm"]["type"];
double risk_limit = config["risk"]["max_position"];
```

### googletest/
**Google Test Framework** - C++ testing framework
- **Components**: GoogleTest + GoogleMock
- **Purpose**: Unit testing, integration testing, performance benchmarks
- **Usage**: `#include <gtest/gtest.h>`, `#include <gmock/gmock.h>`
- **Version**: 1.15.2
- **License**: BSD-3-Clause
- **Homepage**: https://github.com/google/googletest

**Example Usage:**
```cpp
#include <gtest/gtest.h>
#include <gmock/gmock.h>

TEST(LatencyTest, TickToTradeLatency) {
    auto start = std::chrono::high_resolution_clock::now();
    // Trading logic here
    auto end = std::chrono::high_resolution_clock::now();

    auto latency_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    EXPECT_LT(latency_us.count(), 10); // Sub-10 microsecond target
}
```

## Integration with Beacon

These dependencies are automatically configured in the CMake build system:

```cmake
# In your CMakeLists.txt
target_link_libraries(your_app PRIVATE
    beacon_hft
    GTest::gtest_main  # For testing
)

target_include_directories(your_app PRIVATE
    ${CMAKE_SOURCE_DIR}/vendor/nlohmann  # For JSON
)
```

## Production Notes

**For Production Deployment:**
- These are simplified/placeholder implementations for development
- Replace with full vendors for production builds:
  - Download complete nlohmann/json.hpp from releases
  - Use full GoogleTest source for comprehensive testing
- Consider using package managers (vcpkg, Conan) for dependency management

**Security:**
- Verify checksums for all vendor dependencies
- Keep dependencies updated for security patches
- Consider static analysis of vendor code
