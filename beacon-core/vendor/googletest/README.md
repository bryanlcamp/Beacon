# Google Test

**Google Test is a testing framework developed by the Testing Technology team with Google's specific requirements and constraints in mind.**

## Features

* **xUnit test framework**: Googletest is based on the xUnit testing framework.
* **Test discovery**: Googletest automatically discovers tests.
* **Rich set of assertions**: Googletest provides a rich set of assertions.
* **User-defined assertions**: You May define your own assertions.
* **Death tests**: Googletest supports death tests.
* **Fatal and non-fatal failures**: You can have fatal and non-fatal failures.
* **Value-parameterized tests**: Supports value-parameterized tests.
* **Type-parameterized tests**: Supports type-parameterized tests.
* **Various options for running the tests**: Googletest supports various options for running the tests.
* **XML test report generation**: Supports XML test report generation.

## Quick Start

This is a simplified version of GoogleTest integrated into the Beacon project.

### Basic Test Example

```cpp
#include <gtest/gtest.h>

// Test function
TEST(LatencyTest, BasicLatencyMeasurement) {
    auto start = std::chrono::high_resolution_clock::now();
    // ... test code ...
    auto end = std::chrono::high_resolution_clock::now();

    auto latency_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    EXPECT_LT(latency_us.count(), 10); // Expect less than 10 microseconds
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```

## Integration with Beacon

This GoogleTest installation is specifically configured for the Beacon trading platform testing needs:

- **Performance Testing**: Sub-microsecond latency validation
- **Algorithm Testing**: Trading strategy verification
- **Protocol Testing**: Exchange protocol compliance
- **Integration Testing**: End-to-end system validation

For complete documentation, visit: https://google.github.io/googletest/
