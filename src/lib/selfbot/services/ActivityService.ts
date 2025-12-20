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

export interface ActivityOptions {
    readonly name: string;
    readonly type?: ActivityType;
    readonly state?: string;
    readonly details?: string;
    readonly startTimestamp?: boolean;
    readonly imageUrl?: string;
    readonly imageText?: string;
}

export interface IActivityService {
    setActivity(client: Client, options: ActivityOptions): boolean;
    clearActivity(client: Client): boolean;
    setStatus(client: Client, status: StatusType): boolean;
}

export interface ILogger {
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

class RichPresenceBuilder {
    private readonly presence: RichPresence;

    constructor(client: Client) {
        this.presence = new RichPresence(client);
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
        if (state) {
            this.presence.setState(state);
        }
        return this;
    }

    withDetails(details?: string): this {
        if (details) {
            this.presence.setDetails(details);
        }
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
        if (enabled) {
            this.presence.setStartTimestamp(Date.now());
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
}

export class ActivityService implements IActivityService {
    private readonly logger: ILogger;

    constructor(logger?: ILogger) {
        this.logger = logger ?? Logger.child('[Activity]');
    }

    setActivity(client: Client, options: ActivityOptions): boolean {
        if (!this.validateClient(client)) {
            return false;
        }

        try {
            const presence = this.buildPresence(client, options);
            client.user!.setActivity(presence);
            this.logger.success(`Atividade definida: ${options.name}`);
            return true;
        } catch (error) {
            this.logError('definir atividade', error);
            return false;
        }
    }

    clearActivity(client: Client): boolean {
        if (!this.validateClient(client)) {
            return false;
        }

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
        if (!this.validateClient(client)) {
            return false;
        }

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

    private buildPresence(client: Client, options: ActivityOptions): RichPresence {
        return new RichPresenceBuilder(client)
            .withName(options.name)
            .withType(options.type ?? ActivityType.PLAYING)
            .withState(options.state)
            .withDetails(options.details)
            .withImage(options.imageUrl, options.imageText ?? options.name)
            .withTimestamp(options.startTimestamp ?? false)
            .build();
    }

    private logError(action: string, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`Erro ao ${action}: ${message}`);
    }
}

export const createActivityService = (logger?: ILogger): ActivityService => {
    return new ActivityService(logger);
};
