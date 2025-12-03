/*
 * =============================================================================
 * Project:      Beacon  
 * Purpose:      Base serializer implementation stub
 * Author:       Bryan Camp
 * =============================================================================
 */

#include <serializers/BaseSerializer.h>
#include <vector>
#include <optional>

namespace beacon::exchanges::serializers {

// Base implementation - only provide default implementations for non-pure virtual methods
void ISerializeMarketData::Flush() {
    // Default implementation - can be overridden by concrete serializers
}

} // namespace beacon::exchanges::serializers