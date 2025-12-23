import { Client, Guild } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';

interface LeaveAllResult {
    readonly totalGuilds: number;
    readonly left: number;
    readonly skipped: number;
    readonly errors: number;
    readonly stopped: boolean;
}

interface OperationState {
    isRunning: boolean;
    shouldStop: boolean;
}

export interface IGuildService {
    leaveAllGuilds(client: Client, whitelist?: string[], delayMs?: number): Promise<LeaveAllResult>;
    leaveGuild(client: Client, guildId: string): Promise<boolean>;
    getGuildCount(client: Client): number;
    getGuildList(client: Client): Map<string, Guild>;
    isRunning(): boolean;
    stop(): void;
}

export interface ILogger {
    info(message: string): void;
    success(message: string): void;
    warning(message: string): void;
    error(message: string): void;
}

class OperationStateManager {
    private readonly state: OperationState = {
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
    private result: LeaveAllResult = {
        totalGuilds: 0,
        left: 0,
        skipped: 0,
        errors: 0,
        stopped: false
    };

    setTotalGuilds(count: number): this {
        this.result = { ...this.result, totalGuilds: count };
        return this;
    }

    incrementLeft(): this {
        this.result = { ...this.result, left: this.result.left + 1 };
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

    build(): LeaveAllResult {
        return { ...this.result };
    }
}

interface GuildRepository {
    getGuildList(client: Client): Map<string, Guild>;
    getGuildCount(client: Client): number;
    leaveGuild(client: Client, guildId: string): Promise<boolean>;
}

class DefaultGuildRepository implements GuildRepository {
    getGuildList(client: Client): Map<string, Guild> {
        return client.guilds.cache as Map<string, Guild>;
    }

    getGuildCount(client: Client): number {
        return client.guilds.cache.size;
    }

    async leaveGuild(client: Client, guildId: string): Promise<boolean> {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;
        await guild.leave();
        return true;
    }
}

interface GuildServiceDependencies {
    readonly logger?: ILogger;
    readonly repository?: GuildRepository;
}

export class GuildService implements IGuildService {
    private static readonly DEFAULT_DELAY_MS = 1500;

    private readonly logger: ILogger;
    private readonly repository: GuildRepository;
    private readonly stateManager: OperationStateManager;

    constructor(dependencies?: GuildServiceDependencies) {
        this.logger = dependencies?.logger ?? Logger.child('[Guild]');
        this.repository = dependencies?.repository ?? new DefaultGuildRepository();
        this.stateManager = new OperationStateManager();
    }

    async leaveAllGuilds(
        client: Client,
        whitelist: string[] = [],
        delayMs: number = GuildService.DEFAULT_DELAY_MS
    ): Promise<LeaveAllResult> {
        if (this.stateManager.isRunning()) {
            this.logger.warning('Saída de servidores já está em andamento!');
            return new ResultBuilder().build();
        }

        this.stateManager.start();
        const resultBuilder = new ResultBuilder();

        try {
            const guilds = this.repository.getGuildList(client);
            resultBuilder.setTotalGuilds(guilds.size);

            if (guilds.size === 0) {
                this.logger.info('Nenhum servidor encontrado');
                return resultBuilder.build();
            }

            this.logger.info(`Iniciando saída de ${guilds.size} servidores...`);

            for (const [guildId, guild] of guilds) {
                if (this.stateManager.shouldStop()) {
                    resultBuilder.setStopped();
                    this.logger.warning('Operação interrompida pelo usuário');
                    break;
                }

                await this.processGuild(client, guildId, guild, whitelist, resultBuilder);
                await this.delay(delayMs);
            }

            this.logFinalResult(resultBuilder.build());
            return resultBuilder.build();
        } finally {
            this.stateManager.reset();
        }
    }

    async leaveGuild(client: Client, guildId: string): Promise<boolean> {
        try {
            return await this.repository.leaveGuild(client, guildId);
        } catch (error) {
            this.logError(`Erro ao sair do servidor ${guildId}`, error);
            return false;
        }
    }

    getGuildCount(client: Client): number {
        return this.repository.getGuildCount(client);
    }

    getGuildList(client: Client): Map<string, Guild> {
        return this.repository.getGuildList(client);
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
        this.logger.info('🛑 Parando saída de servidores...');
    }

    private async processGuild(
        client: Client,
        guildId: string,
        guild: Guild,
        whitelist: string[],
        resultBuilder: ResultBuilder
    ): Promise<void> {
        if (this.isWhitelisted(guildId, whitelist)) {
            resultBuilder.incrementSkipped();
            return;
        }

        const success = await this.leaveGuild(client, guildId);

        if (success) {
            resultBuilder.incrementLeft();
            this.logger.success(`✅ Saiu: ${this.getGuildName(guild, guildId)}`);
        } else {
            resultBuilder.incrementErrors();
        }
    }

    private isWhitelisted(guildId: string, whitelist: string[]): boolean {
        return whitelist.includes(guildId);
    }

    private getGuildName(guild: Guild, fallbackId: string): string {
        return guild?.name ?? fallbackId;
    }

    private logFinalResult(result: LeaveAllResult): void {
        const status = result.stopped ? '(Interrompido)' : '(Concluído)';
        this.logger.success(
            `${status} Saiu de: ${result.left}/${result.totalGuilds}, ` +
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

let guildServiceInstance: GuildService | null = null;

export const getGuildService = (): GuildService => {
    if (!guildServiceInstance) {
        guildServiceInstance = new GuildService();
    }
    return guildServiceInstance;
};

export const createGuildService = (dependencies?: GuildServiceDependencies): GuildService => {
    return new GuildService(dependencies);
};
