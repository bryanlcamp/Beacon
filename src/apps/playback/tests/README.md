# Beacon Playback Tests

This directory contains comprehensive unit tests for the Beacon market data playback application, following the same structure and patterns as the generator tests.

## Test Structure

- **TestBinaryInputFileReader.cpp** - Tests for loading and validating binary market data files
- **TestUdpReplayer.cpp** - Tests for UDP multicast message transmission
- **TestRulesEngine.cpp** - Tests for playback rules and decision-making logic
- **TestPlaybackState.cpp** - Tests for playback state tracking and statistics
- **TestPlaybackIntegration.cpp** - End-to-end integration tests

## Test Configuration Files

- **TestValidConfig.json** - Complete valid playback configuration
- **TestMinimalConfig.json** - Minimal valid configuration
- **test_sample.bin** - Sample binary data file for testing

## Running Tests

```bash
# Build and run all playback tests
cmake --build build
ctest --test-dir build/src/apps/playback/tests

# Run specific test
./build/src/apps/playback/tests/TestPlaybackIntegration

# Run with verbose output
./build/src/apps/playback/tests/TestPlaybackIntegration --gtest_filter="*Integration*" -v
```

## Coverage

The playback tests provide comprehensive coverage of:
- ✅ Binary file loading and validation
- ✅ UDP multicast transmission
- ✅ Rules engine decision logic
- ✅ Exchange format detection
- ✅ Error handling and edge cases
- ✅ Performance and throughput
- ✅ Integration with generator output

## Test Data Generation

Test data files are generated using the generator application:

```bash
# Generate test binary data
./bin/debug/generator -i config/generator/sample_config.json -o src/apps/playback/tests/test_sample.bin
```