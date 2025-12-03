#pragma once

#include <string>
#include "SymbolParameters.h" // For PriceRange and QuantityRange

namespace beacon::generator {
    struct SymbolGenerationData {
        std::string symbol;
        double percent; // Field to store the percentage
        PriceRange price_range; // Single price range
        QuantityRange quantity_range; // Single quantity range
    };
}