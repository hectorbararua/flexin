/**
 * Selfbot Manager Module
 * 
 * This module provides a complete solution for managing multiple selfbot accounts
 * following Clean Code and SOLID principles.
 * 
 * @example Basic Usage:
 * ```typescript
 * import { getSelfbotManager } from './lib/selfbot';
 * 
 * const manager = getSelfbotManager();
 * 
 * // Add clients
 * manager.addClients([
 *     { token: 'token_1', label: 'Conta Principal' },
 *     { token: 'token_2', label: 'Conta Secundária' },
 * ]);
 * 
 * // Login all
 * await manager.loginAll();
 * 
 * // Join voice with all
 * await manager.joinVoiceAll('CHANNEL_ID');
 * 
 * // Clean DMs sequentially
 * await manager.cleanDMSequentially('USER_ID');
 * ```
 */

// Types and Interfaces
export * from './types';

// Utilities
export { Logger, createLogger } from './utils/Logger';
export { delay, withRetry, executeSequentially, RateLimiter } from './utils/delay';

// Services
export { VoiceService, createVoiceService } from './services/VoiceService';
export { DMService, createDMService } from './services/DMService';

// Client
export { SelfbotClient, createSelfbotClient } from './SelfbotClient';

// Manager (Main Export)
export { 
    SelfbotManager, 
    getSelfbotManager, 
    createSelfbotManager 
} from './SelfbotManager';

