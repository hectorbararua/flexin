import { Client, User } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';

interface RemoveAllResult {
    readonly totalFriends: number;
    readonly removed: number;
    readonly skipped: number;
    readonly errors: number;
    readonly stopped: boolean;
}

interface OperationState {
    isRunning: boolean;
    shouldStop: boolean;
}

export interface ILogger {
    info(message: string): void;
    success(message: string): void;
    warning(message: string): void;
    error(message: string): void;
}

export interface IFriendRepository {
    getFriendList(client: Client): Map<string, User>;
    getFriendCount(client: Client): number;
    removeFriend(client: Client, userId: string): Promise<boolean>;
}

export interface IFriendService {
    removeAllFriends(client: Client, whitelist?: string[], delayMs?: number): Promise<RemoveAllResult>;
    removeFriend(client: Client, userId: string): Promise<boolean>;
    getFriendCount(client: Client): number;
    getFriendList(client: Client): Map<string, User>;
    isRunning(): boolean;
    stop(): void;
}

class FriendRepository implements IFriendRepository {
    getFriendList(client: Client): Map<string, User> {
        return client.relationships?.friendCache || new Map();
    }

    getFriendCount(client: Client): number {
        return this.getFriendList(client).size;
    }

    async removeFriend(client: Client, userId: string): Promise<boolean> {
        await (client as any).api.users['@me'].relationships[userId].delete();
        return true;
    }
}

class OperationStateManager {
    private state: OperationState = {
        isRunning: false,
        shouldStop: false
    };

    start(): void {
        this.state.isRunning = true;
        this.state.shouldStop = false;
    }

    stop(): void {
        this.state.shouldStop = true;
    }

    reset(): void {
        this.state.isRunning = false;
        this.state.shouldStop = false;
    }

    isRunning(): boolean {
        return this.state.isRunning;
    }

    shouldStop(): boolean {
        return this.state.shouldStop;
    }
}

class ResultBuilder {
    private result: RemoveAllResult = {
        totalFriends: 0,
        removed: 0,
        skipped: 0,
        errors: 0,
        stopped: false
    };

    setTotalFriends(count: number): this {
        this.result = { ...this.result, totalFriends: count };
        return this;
    }

    incrementRemoved(): this {
        this.result = { ...this.result, removed: this.result.removed + 1 };
        return this;
    }

    incrementSkipped(): this {
        this.result = { ...this.result, skipped: this.result.skipped + 1 };
        return this;
    }

    incrementErrors(): this {
        this.result = { ...this.result, errors: this.result.errors + 1 };
        return this;
    }

    setStopped(): this {
        this.result = { ...this.result, stopped: true };
        return this;
    }

    build(): RemoveAllResult {
        return { ...this.result };
    }
}

export class FriendService implements IFriendService {
    private static readonly DEFAULT_DELAY_MS = 500;

    private readonly logger: ILogger;
    private readonly repository: IFriendRepository;
    private readonly stateManager: OperationStateManager;

    constructor(logger?: ILogger, repository?: IFriendRepository) {
        this.logger = logger ?? Logger.child('[Friend]');
        this.repository = repository ?? new FriendRepository();
        this.stateManager = new OperationStateManager();
    }

    async removeAllFriends(
        client: Client,
        whitelist: string[] = [],
        delayMs: number = FriendService.DEFAULT_DELAY_MS
    ): Promise<RemoveAllResult> {
        if (this.stateManager.isRunning()) {
            this.logger.warning('Remoção de amigos já está em andamento!');
            return new ResultBuilder().build();
        }

        this.stateManager.start();
        const resultBuilder = new ResultBuilder();

        try {
            const friendCache = this.repository.getFriendList(client);
            resultBuilder.setTotalFriends(friendCache.size);

            if (friendCache.size === 0) {
                this.logger.info('Nenhum amigo encontrado');
                return resultBuilder.build();
            }

            this.logger.info(`Iniciando remoção de ${friendCache.size} amigos...`);

            for (const [friendId, friend] of friendCache) {
                if (this.stateManager.shouldStop()) {
                    resultBuilder.setStopped();
                    this.logger.warning('Remoção interrompida pelo usuário');
                    break;
                }

                await this.processFriend(client, friendId, friend, whitelist, resultBuilder);
                await this.delay(delayMs);
            }

            this.logFinalResult(resultBuilder.build());
            return resultBuilder.build();
        } finally {
            this.stateManager.reset();
        }
    }

    async removeFriend(client: Client, userId: string): Promise<boolean> {
        try {
            return await this.repository.removeFriend(client, userId);
        } catch (error) {
            this.logError(`Erro ao remover amigo ${userId}`, error);
            return false;
        }
    }

    getFriendCount(client: Client): number {
        return this.repository.getFriendCount(client);
    }

    getFriendList(client: Client): Map<string, User> {
        return this.repository.getFriendList(client);
    }

    isRunning(): boolean {
        return this.stateManager.isRunning();
    }

    stop(): void {
        if (!this.stateManager.isRunning()) {
            this.logger.warning('Nenhuma operação em andamento para parar');
            return;
        }
        this.stateManager.stop();
        this.logger.info('🛑 Parando remoção de amigos...');
    }

    private async processFriend(
        client: Client,
        friendId: string,
        friend: User,
        whitelist: string[],
        resultBuilder: ResultBuilder
    ): Promise<void> {
        if (this.isWhitelisted(friendId, whitelist)) {
            resultBuilder.incrementSkipped();
            return;
        }

        const success = await this.removeFriend(client, friendId);

        if (success) {
            resultBuilder.incrementRemoved();
            this.logger.success(`✅ Removido: ${this.getFriendName(friend, friendId)}`);
        } else {
            resultBuilder.incrementErrors();
        }
    }

    private isWhitelisted(userId: string, whitelist: string[]): boolean {
        return whitelist.includes(userId);
    }

    private getFriendName(friend: User, fallbackId: string): string {
        return friend?.username ?? friend?.tag ?? fallbackId;
    }

    private logFinalResult(result: RemoveAllResult): void {
        const status = result.stopped ? '(Interrompido)' : '(Concluído)';
        this.logger.success(
            `${status} Removidos: ${result.removed}/${result.totalFriends}, ` +
            `Pulados: ${result.skipped}, Erros: ${result.errors}`
        );
    }

    private logError(message: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`${message}: ${errorMessage}`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const createFriendService = (logger?: ILogger): FriendService => {
    return new FriendService(logger);
};

export const getFriendService = (): FriendService => new FriendService();
