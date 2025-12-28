import { Client, EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { MvpRepository, MvpData } from './MvpRepository';
import { channelConfig } from '../../config/ChannelConfigService';
import { COLORS } from '../../config/emojis';
import { SPECIAL_ROLES } from '../../config/roles';

export class MvpService {
    private repository: MvpRepository;

    constructor() {
        this.repository = new MvpRepository();
    }

    async addMvp(userId: string, username: string, client: Client): Promise<number> {
        const newTotal = this.repository.addMvp(userId, username);
        await this.updateRoles(client);
        await this.sendRankingUpdate(client);
        return newTotal;
    }

    getTopRanking(limit: number = 10): MvpData[] {
        return this.repository.getTopRanking(limit);
    }

    async updateRoles(client: Client): Promise<void> {
        const guild = client.guilds.cache.get(channelConfig.guild.mainGuildId);
        if (!guild) return;

        const top10Ids = this.repository.getTop10UserIds();
        const mvpRoleId = SPECIAL_ROLES.MVP;

        if (!mvpRoleId) return;

        try {
            const role = await guild.roles.fetch(mvpRoleId);
            if (!role) return;

            const currentMembers = role.members;

            for (const [memberId, member] of currentMembers) {
                if (!top10Ids.includes(memberId)) {
                    await member.roles.remove(mvpRoleId).catch(() => {});
                }
            }

            for (const userId of top10Ids) {
                try {
                    const member = await guild.members.fetch(userId);
                    if (member && !member.roles.cache.has(mvpRoleId)) {
                        await member.roles.add(mvpRoleId).catch(() => {});
                    }
                } catch {}
            }
        } catch (error) {
            console.error('Erro ao atualizar cargos MVP:', error);
        }
    }

    async sendRankingUpdate(client: Client): Promise<void> {
        const guild = client.guilds.cache.get(channelConfig.guild.mainGuildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(channelConfig.ranking.rankingMvpChannelId) as TextChannel;
        if (!channel) return;

        const embed = await this.buildRankingEmbed(guild);

        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(
            msg => msg.author.id === client.user?.id &&
                msg.embeds[0]?.title === '🏆 Ranking de MVPs'
        );

        if (botMessage) {
            await botMessage.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
    }

    async buildRankingEmbed(guild: Guild): Promise<EmbedBuilder> {
        const top10 = this.getTopRanking(10);

        const rankingLines = await Promise.all(
            top10.map(async (mvp, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

                let displayName = mvp.username;
                try {
                    const member = await guild.members.fetch(mvp.odiscordUserId);
                    displayName = member.displayName;
                } catch {}

                return `${medal} **${displayName}** — ${mvp.totalMvps} MVP${mvp.totalMvps > 1 ? 's' : ''}`;
            })
        );

        return new EmbedBuilder()
            .setTitle('🏆 Ranking de MVPs')
            .setDescription(
                rankingLines.length > 0
                    ? rankingLines.join('\n')
                    : 'Nenhum MVP registrado ainda.'
            )
            .setColor(COLORS.INFO)
            .setFooter({ text: `Top 10 ganham o cargo de MVP` })
            .setTimestamp();
    }
}

export const mvpService = new MvpService();
