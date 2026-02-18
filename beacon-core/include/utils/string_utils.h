#pragma once
#include <string>
#include <vector>

// String utility functions for high-performance systems
namespace beacon { namespace utils {

    // Fast string splitting
    std::vector<std::string> split(const std::string& str, char delimiter);

    // Fast string trimming
    std::string trim(const std::string& str);

    // Case-insensitive string comparison
    bool iequals(const std::string& a, const std::string& b);

    // Fast string to number conversions
    long fast_atol(const char* str);
    double fast_atod(const char* str);

}}
