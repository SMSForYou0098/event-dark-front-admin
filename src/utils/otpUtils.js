/**
 * Parse retry_after value from API response
 * Handles both numeric (seconds) and string formats ("7 minutes", "30 seconds")
 * @param {string|number} retryAfter - The retry_after value from API
 * @returns {number} - Seconds to wait
 */
export const parseRetryAfter = (retryAfter) => {
    if (!retryAfter) return 0;

    // If it's already a number, return it
    if (typeof retryAfter === 'number') {
        return Math.ceil(retryAfter);
    }

    // Parse string format like "7 minutes", "30 seconds", "1 hour"
    const str = retryAfter.toString().toLowerCase().trim();

    // Extract number and unit
    const match = str.match(/(\d+\.?\d*)\s*(minute|second|hour|min|sec|hr)s?/i);

    if (!match) {
        // If no match, try to parse as plain number
        const num = parseFloat(str);
        return isNaN(num) ? 0 : Math.ceil(num);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Convert to seconds
    if (unit.startsWith('hour') || unit === 'hr') {
        return Math.ceil(value * 3600);
    } else if (unit.startsWith('minute') || unit === 'min') {
        return Math.ceil(value * 60);
    } else if (unit.startsWith('second') || unit === 'sec') {
        return Math.ceil(value);
    }

    return 0;
};

/**
 * Format seconds into human-readable time string
 * @param {number} seconds - Seconds to format
 * @returns {string} - Formatted string like "14m 50s" or "50s"
 */
export const formatCooldownTime = (seconds) => {
    if (seconds <= 0) return '';

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
};

/**
 * Format seconds into MM:SS format for display
 * @param {number} seconds - Seconds to format
 * @returns {string} - Formatted string like "14:50"
 */
export const formatCooldownTimer = (seconds) => {
    if (seconds <= 0) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${String(secs).padStart(2, '0')}`;
};
