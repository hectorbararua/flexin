"use strict";
/**
 * Utility functions for handling delays and timing
 * Essential for rate limit management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.executeSequentially = exports.withRetry = exports.delay = void 0;
/**
 * Creates a promise that resolves after specified milliseconds
 * @param ms - Milliseconds to wait
 */
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
/**
 * Executes a function with retry logic and exponential backoff
 * @param fn - Function to execute
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay between retries (doubles each retry)
 */
const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                await (0, exports.delay)(waitTime);
            }
        }
    }
    throw lastError;
};
exports.withRetry = withRetry;
/**
 * Executes an array of async functions sequentially with delay between each
 * @param functions - Array of async functions to execute
 * @param delayMs - Delay between each execution
 */
const executeSequentially = async (functions, delayMs = 1000) => {
    const results = [];
    for (let i = 0; i < functions.length; i++) {
        const result = await functions[i]();
        results.push(result);
        // Don't delay after the last function
        if (i < functions.length - 1) {
            await (0, exports.delay)(delayMs);
        }
    }
    return results;
};
exports.executeSequentially = executeSequentially;
/**
 * Creates a rate limiter that ensures minimum delay between calls
 */
class RateLimiter {
    lastCallTime = 0;
    minDelay;
    constructor(minDelayMs) {
        this.minDelay = minDelayMs;
    }
    async throttle() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        if (timeSinceLastCall < this.minDelay) {
            await (0, exports.delay)(this.minDelay - timeSinceLastCall);
        }
        this.lastCallTime = Date.now();
    }
    async execute(fn) {
        await this.throttle();
        return fn();
    }
}
exports.RateLimiter = RateLimiter;
