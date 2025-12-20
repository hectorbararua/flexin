import { Client } from 'discord.js-selfbot-v13';
import { v4 as uuidv4 } from 'uuid';
import { ISelfbotClient, SelfbotConfig, SelfbotStatus } from './types';
import { createLogger } from './utils/Logger';
import { VoiceService, createVoiceService } from './services/VoiceService';
import { DMService, createDMService } from './services/DMService';
import { ActivityService, createActivityService } from './services/ActivityService';

export class SelfbotClient implements ISelfbotClient {
    public readonly id: string;
    public readonly label: string;

    private _status: SelfbotStatus = SelfbotStatus.OFFLINE;
    private readonly _client: Client;
    private readonly token: string;
    private readonly logger;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    public readonly voiceService: VoiceService;
    public readonly dmService: DMService;
    public readonly activityService: ActivityService;

    constructor(config: SelfbotConfig) {
        this.id = uuidv4();
        this.token = config.token;
        this.label = config.label || `Bot-${this.id.slice(0, 6)}`;

        this._client = new Client();
        this.voiceService = createVoiceService();
        this.dmService = createDMService();
        this.activityService = createActivityService();

        this.logger = createLogger({ prefix: `[${this.label}]` });

        this.setupEventListeners();
    }

    get status(): SelfbotStatus {
        return this._status;
    }

    get client(): Client {
        return this._client;
    }

    get username(): string | null {
        return this._client.user?.username || null;
    }

    get tag(): string | null {
        return this._client.user?.tag || null;
    }

    async login(): Promise<boolean> {
        if (this._status === SelfbotStatus.ONLINE) {
            this.logger.warning('Cliente já está online');
            return true;
        }

        try {
            this._status = SelfbotStatus.CONNECTING;
            this.logger.info('Conectando...');

            await this._client.login(this.token);
            await this.waitForReady();

            return true;
        } catch (error) {
            this._status = SelfbotStatus.ERROR;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Falha ao conectar: ${errorMessage}`);
            return false;
        }
    }

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

    isReady(): boolean {
        return this._status === SelfbotStatus.ONLINE && this._client.user !== null;
    }

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

        this._client.on('voiceStateUpdate', async (oldState: any, newState: any) => {
            if (oldState.id !== this._client.user?.id) return;

            const targetChannelId = this.voiceService.getTargetChannelId();

            if (newState.channel && newState.channelId === targetChannelId) {
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
                return;
            }

            if (this.reconnectTimeout) {
                return;
            }

            if (oldState.channel && !newState.channel) {
                if (this.voiceService.shouldReconnect()) {
                    this.logger.warning('Desconectado do canal de voz, tentando reconectar em 5s...');
                    this.scheduleReconnect(5000);
                }
                return;
            }

            if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
                if (this.voiceService.shouldReconnect()) {
                    this.logger.warning(`Movido para: ${newState.channel.name}, voltando ao canal original em 3s...`);
                    this.scheduleReconnect(3000);
                }
            }
        });

        this._client.on('voiceError', (error: Error) => {
            this.logger.error(`Erro de voz: ${error.message}`);
        });
    }

    private scheduleReconnect(delayMs: number): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            
            if (!this.voiceService.shouldReconnect()) {
                return;
            }

            try {
                await this.voiceService.reconnect(this._client);
            } catch (error) {
                this.logger.error(`Erro ao reconectar ao canal de voz: ${error}`);
            }
        }, delayMs);
    }

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

export const createSelfbotClient = (config: SelfbotConfig): SelfbotClient => {
    return new SelfbotClient(config);
};
