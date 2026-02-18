#pragma once
// CPU pause instruction for spin loops
namespace beacon { namespace hft { namespace core {
    inline void cpu_pause() {
        __builtin_ia32_pause();
    }
}}}
