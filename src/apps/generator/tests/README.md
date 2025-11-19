# Generator Unit Tests

This directory contains comprehensive unit tests for the Beacon Market Data Generator.

## Test Structure

### Test Files

- **`test_config_provider.cpp`** - Tests configuration loading, validation, and serializer creation
- **`test_message_generator.cpp`** - Tests message generation logic, wave patterns, and burst dynamics  
- **`test_csv_serializer.cpp`** - Tests CSV output formatting, price conversion, and message serialization
- **`test_stats_manager.cpp`** - Tests statistics collection, calculation accuracy, and output formatting
- **`test_generator_integration.cpp`** - End-to-end integration tests of the complete pipeline

### Test Categories

#### ConfigProvider Tests
- ✅ Valid configuration loading and parsing
- ✅ Invalid configuration rejection (malformed JSON, missing files)
- ✅ Exchange type validation (nsdq, cme, nyse)
- ✅ Symbol percentage validation (must sum to 100%)
- ✅ Wave and burst configuration loading
- ✅ CSV mode toggle functionality
- ✅ Serializer factory creation

#### MessageGenerator Tests  
- ✅ Message generation with realistic market patterns
- ✅ Symbol distribution according to configuration percentages
- ✅ Wave amplitude calculations and market rhythm
- ✅ Burst generation with configurable intensity
- ✅ Binary and CSV output file creation
- ✅ Large message count handling

#### CsvSerializer Tests
- ✅ CSV header generation
- ✅ Message serialization (ADD_ORDER, TRADE, CANCEL_ORDER, REPLACE_ORDER)
- ✅ Price formatting (converts integers to decimal format)
- ✅ Multiple message handling
- ✅ Edge cases (zero prices, large quantities)

#### StatsManager Tests
- ✅ Statistics collection for multiple symbols
- ✅ Buy/sell average calculations
- ✅ Spread calculations and percentage formatting
- ✅ Volume totaling and order counting
- ✅ Edge cases (zero quantities, high prices, special characters)

#### Integration Tests
- ✅ Full pipeline testing (Config → Generator → Output)
- ✅ Binary and CSV output validation
- ✅ Symbol distribution accuracy verification
- ✅ Wave and burst configuration effectiveness
- ✅ Multiple exchange type support
- ✅ Large-scale generation stability
- ✅ Output consistency across runs

## Building and Running Tests

### Build Tests
```bash
# From the beacon root directory
cmake --build build --target run_generator_tests
```

### Run Individual Test Suites
```bash
# From generator/tests directory after building
./build/test_config_provider
./build/test_message_generator  
./build/test_csv_serializer
./build/test_stats_manager
./build/test_generator_integration
```

### Run All Tests
```bash
# Run all generator tests
cd build/src/apps/generator/tests
ctest --output-on-failure

# Or use the custom target
cmake --build build --target run_generator_tests
```

## Test Configuration Files

The tests automatically create temporary configuration files for testing:

- **Valid configurations** - Test normal operation paths
- **Invalid configurations** - Test error handling and validation
- **Edge case configurations** - Test boundary conditions
- **Multi-symbol configurations** - Test complex scenarios

All test files are automatically cleaned up after test completion.

## Coverage Areas

### Core Functionality
- Configuration parsing and validation
- Message generation algorithms  
- Wave pattern implementation
- Burst dynamics
- Statistics collection and formatting
- File I/O operations

### Error Handling
- Invalid configuration files
- Missing dependencies
- File system errors
- Edge cases and boundary conditions

### Performance  
- Large message generation (10K+ messages)
- Memory usage validation
- File size consistency

### Integration
- End-to-end pipeline testing
- Cross-component interaction
- Real-world usage scenarios

## Adding New Tests

When adding new functionality to the generator:

1. **Unit Tests** - Add tests to the appropriate `test_*.cpp` file
2. **Integration Tests** - Add end-to-end tests to `test_generator_integration.cpp`
3. **Test Data** - Create test configurations in the test setup methods
4. **Documentation** - Update this README with new test coverage

### Test Naming Convention
- Test class names: `ComponentNameTest`
- Test method names: `TestsSpecificBehavior` (descriptive action)
- Test files: `test_component_name.cpp`

## Dependencies

- **GoogleTest** - Unit testing framework
- **nlohmann/json** - JSON parsing (tested indirectly)
- **C++ filesystem** - File operations
- **Generator source code** - All generator components under test