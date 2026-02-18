#include "string_utils.h"
#include <algorithm>
#include <cctype>
#include <sstream>

namespace beacon { namespace utils {

    std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        while (std::getline(ss, token, delimiter)) {
            tokens.push_back(token);
        }
        return tokens;
    }

    std::string trim(const std::string& str) {
        auto start = str.begin();
        auto end = str.end();

        // Trim leading whitespace
        while (start != end && std::isspace(*start)) {
            ++start;
        }

        // Trim trailing whitespace
        while (start != end && std::isspace(*(end - 1))) {
            --end;
        }

        return std::string(start, end);
    }

    bool iequals(const std::string& a, const std::string& b) {
        return a.size() == b.size() &&
               std::equal(a.begin(), a.end(), b.begin(),
                         [](char a, char b) {
                             return std::tolower(a) == std::tolower(b);
                         });
    }

    long fast_atol(const char* str) {
        // TODO: Optimized string to long conversion
        return std::atol(str);
    }

    double fast_atod(const char* str) {
        // TODO: Optimized string to double conversion
        return std::atof(str);
    }

}}
