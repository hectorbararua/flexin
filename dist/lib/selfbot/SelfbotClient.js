"use strict";
/**
 * SelfbotClient - Wrapper for individual selfbot client instances
 * Encapsulates client state and provides a clean interface
 * Follows Single Responsibility Principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelfbotClient = exports.SelfbotClient = void 0;
const discord_js_selfbot_v13_1 = require("discord.js-selfbot-v13");
const uuid_1 = require("uuid");
const types_1 = require("./types");
const Logger_1 = require("./utils/Logger");
const VoiceService_1 = require("./services/VoiceService");
const DMService_1 = require("./services/DMService");
class SelfbotClient {
    id;
    label;
    _status = types_1.SelfbotStatus.OFFLINE;
    _client;
    token;
    logger;
    // Each client has its own service instances (isolated state)
    voiceService;
    dmService;
    constructor(config) {
        this.id = (0, uuid_1.v4)();
        this.token = config.token;
        this.label = config.label || `Bot-${this.id.slice(0, 6)}`;
        this._client = new discord_js_selfbot_v13_1.Client();
        this.voiceService = (0, VoiceService_1.createVoiceService)();
        this.dmService = (0, DMService_1.createDMService)();
        this.logger = (0, Logger_1.createLogger)({ prefix: `[${this.label}]` });
        this.setupEventListeners();
    }
    /**
     * Gets the current status of the client
     */
    get status() {
        return this._status;
    }
    /**
     * Gets the underlying Discord client
     */
    get client() {
        return this._client;
    }
    /**
     * Gets the username if available
     */
    get username() {
        return this._client.user?.username || null;
    }
    /**
     * Gets the user tag if available
     */
    get tag() {
        return this._client.user?.tag || null;
    }
    /**
     * Attempts to login with the stored token
     */
    async login() {
        if (this._status === types_1.SelfbotStatus.ONLINE) {
            this.logger.warning('Cliente já está online');
            return true;
        }
        try {
            this._status = types_1.SelfbotStatus.CONNECTING;
            this.logger.info('Conectando...');
            await this._client.login(this.token);
            // Wait a bit for the ready event
            await this.waitForReady();
            return true;
        }
        catch (error) {
            this._status = types_1.SelfbotStatus.ERROR;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Falha ao conectar: ${errorMessage}`);
            return false;
        }
    }
    /**
     * Logs out and disconnects the client
     */
    async logout() {
        if (this._status === types_1.SelfbotStatus.OFFLINE) {
            return;
        }
        try {
            this.logger.info('Desconectando...');
            this._client.destroy();
            this._status = types_1.SelfbotStatus.OFFLINE;
            this.logger.success('Desconectado');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro ao desconectar: ${errorMessage}`);
        }
    }
    /**
     * Checks if the client is ready and online
     */
    isReady() {
        return this._status === types_1.SelfbotStatus.ONLINE && this._client.user !== null;
    }
    /**
     * Sets up internal event listeners
     */
    setupEventListeners() {
        this._client.on('ready', () => {
            this._status = types_1.SelfbotStatus.ONLINE;
            this.logger.success(`Online como: ${this.logger.bold(this._client.user?.tag || 'Unknown')}`);
        });
        this._client.on('disconnect', () => {
            this._status = types_1.SelfbotStatus.OFFLINE;
            this.logger.warning('Desconectado do Discord');
        });
        this._client.on('error', (error) => {
            this._status = types_1.SelfbotStatus.ERROR;
            this.logger.error(`Erro: ${error.message}`);
        });
        // Voice state update for auto-reconnect
        this._client.on('voiceStateUpdate', async (oldState, newState) => {
            if (oldState.id !== this._client.user?.id)
                return;
            // Disconnected
            if (oldState.channel && !newState.channel) {
                if (this.voiceService.shouldReconnect()) {
                    this.logger.warning('Desconectado do canal de voz, tentando reconectar...');
                    setTimeout(() => {
                        this.voiceService.reconnect(this._client);
                    }, 5000);
                }
            }
            // Moved to different channel
            if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
                if (this.voiceService.shouldReconnect()) {
                    this.logger.warning(`Movido para: ${newState.channel.name}, voltando ao canal original...`);
                    setTimeout(() => {
                        this.voiceService.reconnect(this._client);
                    }, 3000);
                }
            }
        });
    }
    /**
     * Waits for the client to be ready
     */
    waitForReady(timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            if (this._status === types_1.SelfbotStatus.ONLINE) {
                resolve();
                return;
            }
            const timeout = setTimeout(() => {
                reject(new Error('Timeout aguardando cliente ficar pronto'));
            }, timeoutMs);
            const checkReady = () => {
                if (this._status === types_1.SelfbotStatus.ONLINE) {
                    clearTimeout(timeout);
                    resolve();
                }
                else if (this._status === types_1.SelfbotStatus.ERROR) {
                    clearTimeout(timeout);
                    reject(new Error('Cliente entrou em estado de erro'));
                }
                else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }
}
exports.SelfbotClient = SelfbotClient;
// Factory function
const createSelfbotClient = (config) => {
    return new SelfbotClient(config);
};
exports.createSelfbotClient = createSelfbotClient;
