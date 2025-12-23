import { Client, RichPresence } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';

export enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM = 4,
    COMPETING = 5
}

export type StatusType = 'online' | 'idle' | 'dnd' | 'invisible';

export interface ActivityButton {
    readonly label: string;
    readonly url: string;
}

export interface ActivityOptions {
    readonly name: string;
    readonly type?: ActivityType;
    readonly state?: string;
    readonly details?: string;
    readonly startTimestamp?: boolean;
    readonly imageUrl?: string;
    readonly imageText?: string;
    readonly buttons?: ActivityButton[];
    readonly applicationId?: string;
}

export interface IActivityService {
    setActivity(client: Client, options: ActivityOptions): Promise<boolean>;
    clearActivity(client: Client): boolean;
    setStatus(client: Client, status: StatusType): boolean;
}

interface ILogger {
    info(message: string): void;
    success(message: string): void;
    error(message: string): void;
}

const ACTIVITY_TYPE_MAP: Readonly<Record<ActivityType, string>> = {
    [ActivityType.PLAYING]: 'PLAYING',
    [ActivityType.STREAMING]: 'STREAMING',
    [ActivityType.LISTENING]: 'LISTENING',
    [ActivityType.WATCHING]: 'WATCHING',
    [ActivityType.CUSTOM]: 'CUSTOM',
    [ActivityType.COMPETING]: 'COMPETING'
} as const;

const WS_READY_STATUS = 0;
const CONNECTION_STABILIZE_DELAY = 3000;

class RichPresenceBuilder {
    private readonly presence: RichPresence;

    constructor(client: Client) {
        this.presence = new RichPresence(client);
    }

    withApplicationId(applicationId?: string): this {
        if (applicationId) {
            this.presence.setApplicationId(applicationId);
        }
        return this;
    }

    withName(name: string): this {
        this.presence.setName(name);
        return this;
    }

    withType(type: ActivityType): this {
        const typeString = ACTIVITY_TYPE_MAP[type] ?? ACTIVITY_TYPE_MAP[ActivityType.PLAYING];
        this.presence.setType(typeString as any);
        return this;
    }

    withState(state?: string): this {
        if (state) this.presence.setState(state);
        return this;
    }

    withDetails(details?: string): this {
        if (details) this.presence.setDetails(details);
        return this;
    }

    withImage(imageUrl?: string, imageText?: string): this {
        if (imageUrl) {
            this.presence.setAssetsLargeImage(imageUrl);
            this.presence.setAssetsLargeText(imageText ?? '');
        }
        return this;
    }

    withTimestamp(enabled: boolean): this {
        if (enabled) this.presence.setStartTimestamp(Date.now());
        return this;
    }

    withButtons(buttons?: ActivityButton[]): this {
        if (buttons && buttons.length > 0) {
            buttons.forEach(button => {
                this.presence.addButton(button.label, button.url);
            });
        }
        return this;
    }

    build(): RichPresence {
        return this.presence;
    }
}

class ClientValidator {
    static isLoggedIn(client: Client): boolean {
        return client.user !== null && client.user !== undefined;
    }

    static isWebSocketReady(client: Client): boolean {
        return client.ws.status === WS_READY_STATUS;
    }
}

export class ActivityService implements IActivityService {
    private readonly logger: ILogger;

    constructor(logger?: ILogger) {
        this.logger = logger ?? Logger.child('[Activity]');
    }

    async setActivity(client: Client, options: ActivityOptions): Promise<boolean> {
        if (!this.validateClient(client)) return false;

        try {
            await this.ensureWebSocketReady(client);
            
            const presence = this.buildPresence(client, options);
            this.applyActivity(client, presence);
            
            this.logger.success(`Atividade definida: ${options.name}`);
            return true;
        } catch (error) {
            this.logError('definir atividade', error);
            return false;
        }
    }

    clearActivity(client: Client): boolean {
        if (!this.validateClient(client)) return false;

        try {
            client.user!.setActivity(null as any);
            this.logger.success('Atividade removida');
            return true;
        } catch (error) {
            this.logError('remover atividade', error);
            return false;
        }
    }

    setStatus(client: Client, status: StatusType): boolean {
        if (!this.validateClient(client)) return false;

        try {
            client.user!.setStatus(status);
            this.logger.success(`Status definido: ${status}`);
            return true;
        } catch (error) {
            this.logError('definir status', error);
            return false;
        }
    }

    private validateClient(client: Client): boolean {
        if (!ClientValidator.isLoggedIn(client)) {
            this.logger.error('Cliente não está logado');
            return false;
        }
        return true;
    }

    private async ensureWebSocketReady(client: Client): Promise<void> {
        if (!ClientValidator.isWebSocketReady(client)) {
            this.logger.info('Aguardando conexão estabilizar...');
            await this.delay(CONNECTION_STABILIZE_DELAY);
            
            if (!ClientValidator.isWebSocketReady(client)) {
                throw new Error('WebSocket não está pronto');
            }
        }
    }

    private applyActivity(client: Client, presence: RichPresence): void {
        try {
            client.user!.setActivity(presence);
        } catch {
            client.user!.setPresence({
                activities: [presence.toJSON() as any]
            });
        }
    }

    private buildPresence(client: Client, options: ActivityOptions): RichPresence {
        return new RichPresenceBuilder(client)
            .withApplicationId(options.applicationId)
            .withName(options.name)
            .withType(options.type ?? ActivityType.PLAYING)
            .withState(options.state)
            .withDetails(options.details)
            .withImage(options.imageUrl, options.imageText ?? options.name)
            .withTimestamp(options.startTimestamp ?? false)
            .withButtons(options.buttons)
            .build();
    }

    private logError(action: string, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`Erro ao ${action}: ${message}`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const createActivityService = (logger?: ILogger): ActivityService => {
    return new ActivityService(logger);
};
