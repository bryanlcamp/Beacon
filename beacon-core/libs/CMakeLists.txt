# Add libraries in dependency order (singular names)

# Core libraries
add_subdirectory(beacon_hft)
add_subdirectory(beacon_decoder)
add_subdirectory(beacon_networking)

# Higher-level libraries
add_subdirectory(beacon_algorithm)
