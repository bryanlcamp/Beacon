# =============================================================================
# BeaconAppCommon.cmake
# Common configuration for all Beacon applications
# =============================================================================

# Common compiler flags for all Beacon applications
function(beacon_configure_target target_name)
    # Set C++ standard
    target_compile_features(${target_name} PRIVATE cxx_std_17)

    # Common compile flags
    target_compile_options(${target_name} PRIVATE
        $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
        $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
        $<$<CXX_COMPILER_ID:MSVC>:/W4>
    )

    # Release optimizations
    target_compile_options(${target_name} PRIVATE
        $<$<CONFIG:Release>:-O3 -march=native -DNDEBUG>
        $<$<CONFIG:Debug>:-g -O0 -DDEBUG>
    )

    # Include common directories
    target_include_directories(${target_name} PRIVATE
        ${CMAKE_SOURCE_DIR}/include
        ${CMAKE_SOURCE_DIR}/src
        ${CMAKE_SOURCE_DIR}/src/apps/common
    )
endfunction()

# Function to add a Beacon application
function(add_beacon_app app_name)
    set(options)
    set(oneValueArgs)
    set(multiValueArgs SOURCES LIBS)
    cmake_parse_arguments(ARG "${options}" "${oneValueArgs}" "${multiValueArgs}" ${ARGN})

    # Create the executable
    add_executable(${app_name} ${ARG_SOURCES})

    # Apply common configuration
    beacon_configure_target(${app_name})

    # Link libraries
    if(ARG_LIBS)
        target_link_libraries(${app_name} PRIVATE ${ARG_LIBS})
    endif()

    # Set output directory
    set_target_properties(${app_name} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin/${app_name}
    )
endfunction()
