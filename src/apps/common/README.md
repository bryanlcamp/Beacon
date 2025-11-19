# Common Configuration Usage Guide

## Overview

The Beacon project now uses centralized configuration management with simplified include paths. All applications can access common configuration utilities using clean include statements.

## Include Path Structure

Applications can now include common configuration components with simple includes:

```cpp
#include <common/configuration.h>        // Main configuration utilities
#include <common/configuration/ApplicationName.json>  // Direct access to config files (for reference)
```

## Configuration File Locations

All application configurations are centralized in:
```
src/apps/common/configuration/
├── ClientAlgorithm.json           # Main client algorithm config
├── ClientAlgorithm.Twap.json      # TWAP-specific algorithm config
├── ClientAlgorithm.Hft.json       # HFT-specific algorithm config
├── MarketDataReceiver.json        # Market data receiver config
├── MarketDataReceiver.Protocols.json  # Protocol-specific configs
├── MatchingEngine.json            # Matching engine config
├── Generator.json                 # Market data generator config
└── Playback.json                  # Market data playbook config
```

## Usage Examples

### Loading Application Configuration

```cpp
#include <common/configuration.h>

// Get the standard config path for your application
std::string configPath = beacon::common::configuration::ConfigurationPaths::getApplicationConfigPath("ClientAlgorithm");

// Load the configuration
auto config = beacon::common::configuration::ConfigurationPaths::loadConfiguration(configPath);

// Access network settings
int port = config["networking"]["exchange"]["port"];
std::string host = config["networking"]["exchange"]["host"];
```

### Using Network Configuration Helpers

```cpp
#include <common/configuration.h>

// Create standard network configurations
auto tcpConfig = beacon::common::configuration::NetworkConfig::createTcpConfig(8080);
auto udpConfig = beacon::common::configuration::NetworkConfig::createUdpConfig(8081, "127.0.0.1");
```

## CMakeLists.txt Integration

The common configuration path is automatically included in all application CMakeLists.txt files:

```cmake
# This is automatically included in all applications
include_directories(${CMAKE_SOURCE_DIR}/src/apps/common)
```

Applications that use the common configuration should also link the source:

```cmake
add_executable(your_app 
    src/main.cpp
    ${CMAKE_SOURCE_DIR}/src/apps/common/configuration.cpp
)
```

## Benefits

1. **Simplified Includes**: Use `<common/configuration.h>` instead of relative paths
2. **Centralized Management**: All configs in one location with standardized naming
3. **Type Safety**: C++ classes and structs for configuration validation  
4. **Consistent Paths**: ApplicationName.json naming convention across all apps
5. **Easy Maintenance**: Single location for configuration updates and schema changes

## Migration Notes

- Old: `#include "../../../some/relative/path/config.h"`
- New: `#include <common/configuration.h>`

- Old: Multiple scattered JSON files
- New: Centralized `src/apps/common/configuration/ApplicationName.json` structure