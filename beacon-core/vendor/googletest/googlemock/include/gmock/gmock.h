#pragma once

// Google Mock main header
// This is a placeholder for the full gmock.h header

#include "gtest/gtest.h"

namespace testing {

    // Mock method macro placeholder
    #define MOCK_METHOD(return_type, method_name, signature) \
        virtual return_type method_name signature { \
            return return_type{}; \
        }

    #define MOCK_METHOD0(method_name, signature) MOCK_METHOD(auto, method_name, ())
    #define MOCK_METHOD1(method_name, signature) MOCK_METHOD(auto, method_name, (auto))
    #define MOCK_METHOD2(method_name, signature) MOCK_METHOD(auto, method_name, (auto, auto))

    // Expectation macros
    #define EXPECT_CALL(obj, method) \
        do { (void)(obj); } while(0)

    #define ON_CALL(obj, method) \
        do { (void)(obj); } while(0)

    // Action macros
    #define RETURN(value) return (value)
    #define Return(value) RETURN(value)

    // Matcher macros
    #define _(placeholder) true
    #define An(type) true
    #define A(type) true

    // Common matchers
    #define Eq(value) true
    #define Ne(value) true
    #define Lt(value) true
    #define Gt(value) true
    #define Le(value) true
    #define Ge(value) true

} // namespace testing

// Note: This is a minimal placeholder implementation
// In production, this would be replaced with the full Google Mock library
