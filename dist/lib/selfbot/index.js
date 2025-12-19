"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelfbotManager = exports.getSelfbotManager = exports.SelfbotManager = exports.createSelfbotClient = exports.SelfbotClient = exports.createDMService = exports.DMService = exports.createVoiceService = exports.VoiceService = exports.RateLimiter = exports.executeSequentially = exports.withRetry = exports.delay = exports.createLogger = exports.Logger = void 0;
const tslib_1 = require("tslib");
// Types and Interfaces
tslib_1.__exportStar(require("./types"), exports);
// Utilities
var Logger_1 = require("./utils/Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_1.Logger; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return Logger_1.createLogger; } });
var delay_1 = require("./utils/delay");
Object.defineProperty(exports, "delay", { enumerable: true, get: function () { return delay_1.delay; } });
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return delay_1.withRetry; } });
Object.defineProperty(exports, "executeSequentially", { enumerable: true, get: function () { return delay_1.executeSequentially; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return delay_1.RateLimiter; } });
// Services
var VoiceService_1 = require("./services/VoiceService");
Object.defineProperty(exports, "VoiceService", { enumerable: true, get: function () { return VoiceService_1.VoiceService; } });
Object.defineProperty(exports, "createVoiceService", { enumerable: true, get: function () { return VoiceService_1.createVoiceService; } });
var DMService_1 = require("./services/DMService");
Object.defineProperty(exports, "DMService", { enumerable: true, get: function () { return DMService_1.DMService; } });
Object.defineProperty(exports, "createDMService", { enumerable: true, get: function () { return DMService_1.createDMService; } });
// Client
var SelfbotClient_1 = require("./SelfbotClient");
Object.defineProperty(exports, "SelfbotClient", { enumerable: true, get: function () { return SelfbotClient_1.SelfbotClient; } });
Object.defineProperty(exports, "createSelfbotClient", { enumerable: true, get: function () { return SelfbotClient_1.createSelfbotClient; } });
// Manager (Main Export)
var SelfbotManager_1 = require("./SelfbotManager");
Object.defineProperty(exports, "SelfbotManager", { enumerable: true, get: function () { return SelfbotManager_1.SelfbotManager; } });
Object.defineProperty(exports, "getSelfbotManager", { enumerable: true, get: function () { return SelfbotManager_1.getSelfbotManager; } });
Object.defineProperty(exports, "createSelfbotManager", { enumerable: true, get: function () { return SelfbotManager_1.createSelfbotManager; } });
