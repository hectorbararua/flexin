import { Client, Guild, GuildMember, Role } from 'discord.js';
import { UserCallData } from '../callTime/types';
import { IRankingRoleManager, RankingConfig } from './types';
import { RANKING_CONFIG } from './constants';
import { Logger } from '../../utils/Logger';

export class RankingRoleManager implements IRankingRoleManager {
    private readonly logger = Logger.child('[RankingRoles]');
    private readonly config: RankingConfig;

    constructor(config: RankingConfig = RANKING_CONFIG) {
        this.config = config;
    }

    async updateRoles(client: Client, ranking: UserCallData[]): Promise<void> {
        const guild = await this.fetchGuild(client);
        if (!guild) return;

        const roles = await this.fetchRoles(guild);
        if (!roles) return;

        const top10Ids = this.extractTopIds(ranking, 10);
        const top3Ids = this.extractTopIds(ranking, 3);

        await this.assignRolesToRanked(guild, roles, top10Ids, top3Ids);
        await this.removeRolesFromUnranked(roles, top10Ids, top3Ids);
    }

    private async fetchGuild(client: Client): Promise<Guild | null> {
        try {
            return await client.guilds.fetch(this.config.guildId);
        } catch (error) {
            this.logger.error(`Servidor não encontrado: ${error}`);
            return null;
        }
    }

    private async fetchRoles(guild: Guild): Promise<{ top10: Role; top3: Role } | null> {
        try {
            const top10 = await guild.roles.fetch(this.config.top10RoleId);
            const top3 = await guild.roles.fetch(this.config.top3RoleId);

            if (!top10 || !top3) {
                this.logger.error('Cargos não encontrados');
                return null;
            }

            return { top10, top3 };
        } catch (error) {
            this.logger.error(`Erro ao buscar cargos: ${error}`);
            return null;
        }
    }

    private extractTopIds(ranking: UserCallData[], limit: number): string[] {
        return ranking.slice(0, limit).map(u => u.odiscordUserId);
    }

    private async assignRolesToRanked(
        guild: Guild,
        roles: { top10: Role; top3: Role },
        top10Ids: string[],
        top3Ids: string[]
    ): Promise<void> {
        for (const userId of top10Ids) {
            const member = await this.fetchMember(guild, userId);
            if (!member) continue;

            await this.assignTop10Role(member, roles.top10);
            await this.handleTop3Role(member, roles.top3, top3Ids.includes(userId));
        }
    }

    private async fetchMember(guild: Guild, userId: string): Promise<GuildMember | null> {
        try {
            return await guild.members.fetch(userId);
        } catch {
            return null;
        }
    }

    private async assignTop10Role(member: GuildMember, role: Role): Promise<void> {
        if (member.roles.cache.has(role.id)) return;

        try {
            await member.roles.add(role);
            this.logger.info(`Top 10 adicionado: ${member.user.tag}`);
        } catch (error) {
            this.logger.error(`Erro ao adicionar cargo: ${error}`);
        }
    }

    private async handleTop3Role(
        member: GuildMember, 
        role: Role, 
        shouldHave: boolean
    ): Promise<void> {
        const hasRole = member.roles.cache.has(role.id);

        try {
            if (shouldHave && !hasRole) {
                await member.roles.add(role);
                this.logger.info(`Top 3 adicionado: ${member.user.tag}`);
            } else if (!shouldHave && hasRole) {
                await member.roles.remove(role);
                this.logger.info(`Top 3 removido: ${member.user.tag}`);
            }
        } catch (error) {
            this.logger.error(`Erro ao gerenciar cargo Top 3: ${error}`);
        }
    }

    private async removeRolesFromUnranked(
        roles: { top10: Role; top3: Role },
        top10Ids: string[],
        top3Ids: string[]
    ): Promise<void> {
        await this.removeRoleFromNonMembers(roles.top10, top10Ids, 'Top 10');
        await this.removeRoleFromNonMembers(roles.top3, top3Ids, 'Top 3');
    }

    private async removeRoleFromNonMembers(
        role: Role, 
        allowedIds: string[], 
        roleName: string
    ): Promise<void> {
        for (const [memberId, member] of role.members) {
            if (allowedIds.includes(memberId)) continue;

            try {
                await member.roles.remove(role);
                this.logger.info(`${roleName} removido: ${member.user.tag}`);
            } catch (error) {
                this.logger.error(`Erro ao remover ${roleName}: ${error}`);
            }
        }
    }
}

export const createRankingRoleManager = (config?: RankingConfig): IRankingRoleManager => {
    return new RankingRoleManager(config);
};

