export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < maxRetries) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                await delay(waitTime);
            }
        }
    }
    
    throw lastError;
};

export const executeSequentially = async <T>(
    functions: (() => Promise<T>)[],
    delayMs: number = 1000
): Promise<T[]> => {
    const results: T[] = [];
    
    for (let i = 0; i < functions.length; i++) {
        const result = await functions[i]();
        results.push(result);
        
        if (i < functions.length - 1) {
            await delay(delayMs);
        }
    }
    
    return results;
};

export class RateLimiter {
    private lastCallTime: number = 0;
    private readonly minDelay: number;

    constructor(minDelayMs: number) {
        this.minDelay = minDelayMs;
    }

    async throttle(): Promise<void> {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        
        if (timeSinceLastCall < this.minDelay) {
            await delay(this.minDelay - timeSinceLastCall);
        }
        
        this.lastCallTime = Date.now();
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        await this.throttle();
        return fn();
    }
}
