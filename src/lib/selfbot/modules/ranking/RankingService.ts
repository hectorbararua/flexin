import { Client, TextChannel } from 'discord.js';
import { IRankingService, IRankingEmbedBuilder, IRankingRoleManager } from './types';
import { RANKING_CONFIG } from './constants';
import { createRankingEmbedBuilder } from './RankingEmbedBuilder';
import { createRankingRoleManager } from './RankingRoleManager';
import { RankingMessageSender, createRankingMessageSender } from './RankingMessageSender';
import { getCallTimeService, CallTimeService } from '../callTime';
import { Logger } from '../../utils/Logger';

interface RankingServiceDependencies {
    readonly callTimeService: CallTimeService;
    readonly embedBuilder: IRankingEmbedBuilder;
    readonly roleManager: IRankingRoleManager;
    readonly messageSender: RankingMessageSender;
}

export class RankingService implements IRankingService {
    private readonly logger = Logger.child('[Ranking]');
    private readonly callTimeService: CallTimeService;
    private readonly embedBuilder: IRankingEmbedBuilder;
    private readonly roleManager: IRankingRoleManager;
    private readonly messageSender: RankingMessageSender;

    private botClient: Client | null = null;
    private scheduledTimeout: NodeJS.Timeout | null = null;

    constructor(dependencies?: Partial<RankingServiceDependencies>) {
        this.callTimeService = dependencies?.callTimeService ?? getCallTimeService();
        this.embedBuilder = dependencies?.embedBuilder ?? createRankingEmbedBuilder();
        this.roleManager = dependencies?.roleManager ?? createRankingRoleManager();
        this.messageSender = dependencies?.messageSender ?? createRankingMessageSender();
    }

    setBotClient(client: Client): void {
        this.botClient = client;
        this.messageSender.setBotUserId(client.user?.id ?? '');
        this.scheduleNextUpdate();
        this.logger.success('Ranking service iniciado');
    }

    async updateRanking(): Promise<void> {
        if (!this.botClient) {
            this.logger.warning('Bot client não configurado');
            return;
        }

        try {
            const channel = await this.fetchChannel();
            if (!channel) return;

            const ranking = this.callTimeService.getRanking(10);
            const embed = this.embedBuilder.build(
                ranking, 
                (ms) => this.callTimeService.formatTime(ms)
            );

            await this.messageSender.sendOrUpdate(channel, embed);
            await this.roleManager.updateRoles(this.botClient, ranking);

            this.logger.success('Ranking atualizado às 18:00');
        } catch (error) {
            this.logger.error(`Erro ao atualizar: ${error}`);
        }
    }

    stop(): void {
        if (this.scheduledTimeout) {
            clearTimeout(this.scheduledTimeout);
            this.scheduledTimeout = null;
            this.logger.info('Agendamento parado');
        }
    }

    private scheduleNextUpdate(): void {
        this.stop();

        const msUntilNextUpdate = this.calculateMsUntilNextSchedule();
        const hoursUntil = Math.floor(msUntilNextUpdate / (1000 * 60 * 60));
        const minutesUntil = Math.floor((msUntilNextUpdate % (1000 * 60 * 60)) / (1000 * 60));

        this.logger.info(`Próxima atualização em ${hoursUntil}h ${minutesUntil}m (às ${RANKING_CONFIG.updateHour}:${String(RANKING_CONFIG.updateMinute).padStart(2, '0')})`);

        this.scheduledTimeout = setTimeout(async () => {
            await this.updateRanking();
            this.scheduleNextUpdate();
        }, msUntilNextUpdate);
    }

    private calculateMsUntilNextSchedule(): number {
        const now = new Date();
        const targetHour = RANKING_CONFIG.updateHour;
        const targetMinute = RANKING_CONFIG.updateMinute;

        const next = new Date(now);
        next.setHours(targetHour, targetMinute, 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        return next.getTime() - now.getTime();
    }

    private async fetchChannel(): Promise<TextChannel | null> {
        try {
            const channel = await this.botClient!.channels.fetch(RANKING_CONFIG.channelId);

            if (!channel?.isTextBased()) {
                this.logger.error('Canal inválido');
                return null;
            }

            return channel as TextChannel;
        } catch (error) {
            this.logger.error(`Canal não encontrado: ${error}`);
            return null;
        }
    }
}

let instance: RankingService | null = null;

export const getRankingService = (): RankingService => {
    if (!instance) {
        instance = new RankingService();
    }
    return instance;
};

export const createRankingService = (
    dependencies?: Partial<RankingServiceDependencies>
): RankingService => {
    return new RankingService(dependencies);
};

