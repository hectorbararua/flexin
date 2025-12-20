import { Client } from 'discord.js-selfbot-v13';

export enum SelfbotStatus {
    OFFLINE = 'offline',
    ONLINE = 'online',
    CONNECTING = 'connecting',
    ERROR = 'error'
}

export enum OperationResult {
    SUCCESS = 'success',
    FAILURE = 'failure',
    SKIPPED = 'skipped',
    RATE_LIMITED = 'rate_limited'
}

export interface SelfbotConfig {
    token: string;
    label?: string;
}

export interface ManagerConfig {
    delayBetweenAccounts: number;
    delayBetweenOperations: number;
    maxRetries: number;
    reconnectDelay: number;
}

export const DEFAULT_MANAGER_CONFIG: ManagerConfig = {
    delayBetweenAccounts: 2000,
    delayBetweenOperations: 1000,
    maxRetries: 3,
    reconnectDelay: 5000
};

export interface ISelfbotClient {
    readonly id: string;
    readonly label: string;
    readonly status: SelfbotStatus;
    readonly client: Client;
    
    login(): Promise<boolean>;
    logout(): Promise<void>;
    isReady(): boolean;
}

export interface IVoiceService {
    join(client: Client, channelId: string): Promise<boolean>;
    leave(client: Client, guildId: string): Promise<boolean>;
    reconnect(client: Client): Promise<boolean>;
    shouldReconnect(): boolean;
}

export interface IDMService {
    cleanDM(client: Client, userId: string, delayMs?: number): Promise<number>;
    stop(): void;
    isRunning(): boolean;
}

export interface OperationReport {
    clientId: string;
    clientLabel: string;
    result: OperationResult;
    message: string;
    data?: unknown;
}

export interface BatchOperationReport {
    totalClients: number;
    successful: number;
    failed: number;
    skipped: number;
    reports: OperationReport[];
}

export interface ISelfbotManager {
    addClient(config: SelfbotConfig): string;
    removeClient(clientId: string): boolean;
    getClient(clientId: string): ISelfbotClient | undefined;
    getAllClients(): ISelfbotClient[];
    
    loginAll(): Promise<BatchOperationReport>;
    logoutAll(): Promise<void>;
    
    joinVoice(clientId: string, channelId: string): Promise<OperationReport>;
    joinVoiceAll(channelId: string): Promise<BatchOperationReport>;
    
    cleanDM(clientId: string, userId: string): Promise<OperationReport>;
    cleanDMSequentially(userId: string): Promise<BatchOperationReport>;
}

export type SelfbotEventType = 
    | 'clientReady'
    | 'clientDisconnected'
    | 'clientError'
    | 'voiceJoined'
    | 'voiceLeft'
    | 'dmCleaned';

export interface SelfbotEvent {
    type: SelfbotEventType;
    clientId: string;
    timestamp: Date;
    data?: unknown;
}
