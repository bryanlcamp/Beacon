/**
 * Duration Calculator Utilities
 *
 * Pure functions for calculating trading durations, message counts, file sizes,
 * and generation times. No side effects or DOM manipulation.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

/**
 * Calculate total messages needed for a given trading duration
 * @param {number[]} tickRates - Array of ticks per second for each symbol
 * @param {number} durationMinutes - Trading time period in minutes
 * @returns {Object} Calculation results
 */
export const calculateMessagesFromDuration = (tickRates, durationMinutes) => {
    const totalTicksPerSecond = tickRates.reduce((total, rate) => total + rate, 0);
    const totalMessages = totalTicksPerSecond * durationMinutes * 60;

    return {
        totalMessages,
        totalTicksPerSecond,
        durationMinutes,
        averageTicksPerSecond: totalTicksPerSecond / tickRates.length
    };
};

/**
 * Calculate estimated file size from message count
 * @param {number} totalMessages - Total number of messages
 * @param {number} bytesPerMessage - Average bytes per message (default: 120)
 * @returns {Object} File size information
 */
export const calculateFileSize = (totalMessages, bytesPerMessage = 120) => {
    const sizeBytes = totalMessages * bytesPerMessage;
    const sizeMB = sizeBytes / (1024 * 1024);
    const sizeGB = sizeMB / 1024;

    return {
        bytes: sizeBytes,
        mb: Math.round(sizeMB),
        gb: Math.round(sizeGB * 10) / 10, // One decimal place
        formatted: sizeMB > 1024 ? `~${(sizeMB / 1024).toFixed(1)} GB` : `~${Math.round(sizeMB)} MB`
    };
};

/**
 * Calculate estimated generation time
 * @param {number} totalMessages - Total number of messages to generate
 * @param {number} generationRate - Messages per second generation rate (default: 50000)
 * @returns {Object} Generation time information
 */
export const calculateGenerationTime = (totalMessages, generationRate = 50000) => {
    const totalSeconds = Math.max(1, Math.ceil(totalMessages / generationRate));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        totalSeconds,
        hours,
        minutes,
        seconds,
        formatted: hours > 0 ?
            `${hours}h ${minutes}m ${seconds}s` :
            minutes > 0 ?
                `${minutes}m ${seconds}s` :
                `${seconds}s`
    };
};

/**
 * Format duration into HH:MM:SS or MM:SS string
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} Formatted time string
 */
export const formatDurationDisplay = (durationMinutes) => {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return hours > 0 ?
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00` :
        `${minutes.toString().padStart(2, '0')}:00`;
};

/**
 * Parse duration string back to minutes
 * @param {string} durationString - Time string like "30:00" or "01:30:00"
 * @returns {number} Duration in minutes
 */
export const parseDurationString = (durationString) => {
    const parts = durationString.split(':').map(Number);

    if (parts.length === 2) {
        // MM:SS format, assume minutes:seconds
        return parts[0] + (parts[1] / 60);
    } else if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 60 + parts[1] + (parts[2] / 60);
    }

    throw new Error(`Invalid duration format: ${durationString}`);
};
