import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { UserCallData } from '../callTime/types';

export interface RankingConfig {
    readonly channelId: string;
    readonly guildId: string;
    readonly top10RoleId: string;
    readonly top3RoleId: string;
    readonly updateIntervalMs: number;
    readonly updateHour: number;
    readonly updateMinute: number;
}

export interface IRankingEmbedBuilder {
    build(ranking: UserCallData[], formatTime: (ms: number) => string): EmbedBuilder;
}

export interface IRankingRoleManager {
    updateRoles(client: Client, ranking: UserCallData[]): Promise<void>;
}

export interface IRankingMessageSender {
    sendOrUpdate(channel: TextChannel, embed: EmbedBuilder): Promise<void>;
}

export interface IRankingService {
    setBotClient(client: Client): void;
    updateRanking(): Promise<void>;
    stop(): void;
}

