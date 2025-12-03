/*
 * =============================================================================
 * Project:      Beacon
 * Library:      hft
 * Purpose:      CPU pause and spin optimizations
 * Author:       Bryan Camp
 * =============================================================================
 */

#pragma once

namespace beacon::hft::core {

/**
 * @brief Optimized CPU pause for spin loops
 * Uses the most efficient pause instruction for the target architecture
 */
inline void cpu_pause() noexcept {
#if defined(__x86_64__) || defined(_M_X64)
    __builtin_ia32_pause();
#elif defined(__aarch64__) || defined(_M_ARM64)
    __asm__ __volatile__("yield" ::: "memory");
#else
    // Fallback for other architectures
    __asm__ __volatile__("" ::: "memory");
#endif
}

/**
 * @brief Adaptive spin with exponential backoff
 */
class AdaptiveSpinner {
private:
    uint32_t spin_count_ = 0;
    static constexpr uint32_t MAX_SPINS = 4000;
    
public:
    void spin() noexcept {
        if (spin_count_ < MAX_SPINS) {
            for (uint32_t i = 0; i < (1u << (spin_count_ / 1000)); ++i) {
                cpu_pause();
            }
            ++spin_count_;
        } else {
            // Yield to scheduler after max spins
            std::this_thread::yield();
        }
    }
    
    void reset() noexcept { spin_count_ = 0; }
};

} // namespace beacon::hft::core
