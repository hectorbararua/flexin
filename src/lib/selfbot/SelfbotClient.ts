/**
 * SelfbotClient - Wrapper for individual selfbot client instances
 * Encapsulates client state and provides a clean interface
 * Follows Single Responsibility Principle
 */

import { Client } from 'discord.js-selfbot-v13';
import { v4 as uuidv4 } from 'uuid';
import { 
    ISelfbotClient, 
    SelfbotConfig, 
    SelfbotStatus 
} from './types';
import { Logger, createLogger } from './utils/Logger';
import { VoiceService, createVoiceService } from './services/VoiceService';
import { DMService, createDMService } from './services/DMService';

export class SelfbotClient implements ISelfbotClient {
    public readonly id: string;
    public readonly label: string;
    
    private _status: SelfbotStatus = SelfbotStatus.OFFLINE;
    private readonly _client: Client;
    private readonly token: string;
    private readonly logger;
    
    // Each client has its own service instances (isolated state)
    public readonly voiceService: VoiceService;
    public readonly dmService: DMService;

    constructor(config: SelfbotConfig) {
        this.id = uuidv4();
        this.token = config.token;
        this.label = config.label || `Bot-${this.id.slice(0, 6)}`;
        
        this._client = new Client();
        this.voiceService = createVoiceService();
        this.dmService = createDMService();
        
        this.logger = createLogger({ prefix: `[${this.label}]` });
        
        this.setupEventListeners();
    }

    /**
     * Gets the current status of the client
     */
    get status(): SelfbotStatus {
        return this._status;
    }

    /**
     * Gets the underlying Discord client
     */
    get client(): Client {
        return this._client;
    }

    /**
     * Gets the username if available
     */
    get username(): string | null {
        return this._client.user?.username || null;
    }

    /**
     * Gets the user tag if available
     */
    get tag(): string | null {
        return this._client.user?.tag || null;
    }

    /**
     * Attempts to login with the stored token
     */
    async login(): Promise<boolean> {
        if (this._status === SelfbotStatus.ONLINE) {
            this.logger.warning('Cliente já está online');
            return true;
        }

        try {
            this._status = SelfbotStatus.CONNECTING;
            this.logger.info('Conectando...');
            
            await this._client.login(this.token);
            
            // Wait a bit for the ready event
            await this.waitForReady();
            
            return true;
        } catch (error) {
            this._status = SelfbotStatus.ERROR;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Falha ao conectar: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Logs out and disconnects the client
     */
    async logout(): Promise<void> {
        if (this._status === SelfbotStatus.OFFLINE) {
            return;
        }

        try {
            this.logger.info('Desconectando...');
            this._client.destroy();
            this._status = SelfbotStatus.OFFLINE;
            this.logger.success('Desconectado');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro ao desconectar: ${errorMessage}`);
        }
    }

    /**
     * Checks if the client is ready and online
     */
    isReady(): boolean {
        return this._status === SelfbotStatus.ONLINE && this._client.user !== null;
    }

    /**
     * Sets up internal event listeners
     */
    private setupEventListeners(): void {
        this._client.on('ready', () => {
            this._status = SelfbotStatus.ONLINE;
            this.logger.success(`Online como: ${this.logger.bold(this._client.user?.tag || 'Unknown')}`);
        });

        this._client.on('disconnect', () => {
            this._status = SelfbotStatus.OFFLINE;
            this.logger.warning('Desconectado do Discord');
        });

        this._client.on('error', (error: Error) => {
            this._status = SelfbotStatus.ERROR;
            this.logger.error(`Erro: ${error.message}`);
        });

        // Voice state update for auto-reconnect
        this._client.on('voiceStateUpdate', async (oldState: any, newState: any) => {
            if (oldState.id !== this._client.user?.id) return;

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
    private waitForReady(timeoutMs: number = 15000): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._status === SelfbotStatus.ONLINE) {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout aguardando cliente ficar pronto'));
            }, timeoutMs);

            const checkReady = () => {
                if (this._status === SelfbotStatus.ONLINE) {
                    clearTimeout(timeout);
                    resolve();
                } else if (this._status === SelfbotStatus.ERROR) {
                    clearTimeout(timeout);
                    reject(new Error('Cliente entrou em estado de erro'));
                } else {
                    setTimeout(checkReady, 100);
                }
            };

            checkReady();
        });
    }
}

// Factory function
export const createSelfbotClient = (config: SelfbotConfig): SelfbotClient => {
    return new SelfbotClient(config);
};

