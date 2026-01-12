import { Client, EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { MvpRepository, MvpData, MvpType } from './MvpRepository';
import { channelConfig } from '../../config/ChannelConfigService';
import { COLORS, EMOJIS } from '../../config/emojis';
import { SPECIAL_ROLES } from '../../config/roles';

export class MvpService {
    private repository: MvpRepository;

    constructor() {
        this.repository = new MvpRepository();
    }

    // Helper para pegar emojis baseado no tipo
    private getEmojis(type: MvpType) {
        if (type === 'feminino') {
            return {
                icon: EMOJIS.LACO_ROSA,
                ponto: EMOJIS.PONTO_ROSA,
                color: COLORS.FEMININO,
            };
        }
        return {
            icon: '🏆',
            ponto: EMOJIS.PONTO_ROXO,
            color: COLORS.INFO,
        };
    }

    async addMvp(userId: string, username: string, client: Client, type: MvpType = 'normal'): Promise<number> {
        const newTotal = this.repository.addMvp(userId, username, type);
        await this.updateRoles(client, type);
        await this.sendRankingUpdate(client, type);
        return newTotal;
    }

    getTopRanking(limit: number = 10, type: MvpType = 'normal'): MvpData[] {
        return this.repository.getTopRanking(limit, type);
    }

    async updateRoles(client: Client, type: MvpType = 'normal'): Promise<void> {
        const guild = client.guilds.cache.get(channelConfig.guild.mainGuildId);
        if (!guild) return;

        const top10Ids = this.repository.getTop10UserIds(type);
        const mvpRoleId = SPECIAL_ROLES.MVP;

        if (!mvpRoleId) return;

        try {
            const role = await guild.roles.fetch(mvpRoleId);
            if (!role) return;

            // Só gerencia cargo para ranking normal (ou ambos se quiser)
            if (type === 'normal') {
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
            }
        } catch {}
    }

    async sendRankingUpdate(client: Client, type: MvpType = 'normal'): Promise<void> {
        const guild = client.guilds.cache.get(channelConfig.guild.mainGuildId);
        if (!guild) return;

        const channelId = type === 'feminino' 
            ? channelConfig.rankingFeminino?.rankingMvpChannelId 
            : channelConfig.ranking.rankingMvpChannelId;
        
        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId) as TextChannel;
        if (!channel) return;

        const embed = await this.buildRankingEmbed(guild, type);
        const { icon } = this.getEmojis(type);
        const embedTitle = type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Ranking de MVPs (Feminino)` 
            : '🏆 Ranking de MVPs';

        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(
            msg => msg.author.id === client.user?.id &&
                msg.embeds[0]?.title === embedTitle
        );

        if (botMessage) {
            await botMessage.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
    }

    async buildRankingEmbed(guild: Guild, type: MvpType = 'normal'): Promise<EmbedBuilder> {
        const { icon, ponto, color } = this.getEmojis(type);
        const top10 = this.getTopRanking(10, type);
        const title = type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Ranking de MVPs (Feminino)` 
            : '🏆 Ranking de MVPs';

        const rankingLines = await Promise.all(
            top10.map(async (mvp, index) => {
                let medal: string;
                if (type === 'feminino') {
                    medal = index === 0 ? EMOJIS.LACO_ROSA : EMOJIS.PONTO_ROSA;
                } else {
                    medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                }

                let displayName = mvp.username;
                try {
                    const member = await guild.members.fetch(mvp.odiscordUserId);
                    displayName = member.displayName;
                } catch {}

                return type === 'feminino'
                    ? `${medal} **${displayName}** — ${mvp.totalMvps} MVP${mvp.totalMvps > 1 ? 's' : ''}`
                    : `${medal} **${displayName}** — ${mvp.totalMvps} MVP${mvp.totalMvps > 1 ? 's' : ''}`;
            })
        );

        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(
                rankingLines.length > 0
                    ? rankingLines.join('\n')
                    : 'Nenhum MVP registrado ainda.'
            )
            .setColor(color as `#${string}`)
            .setFooter({ text: type === 'normal' ? 'Top 10 ganham o cargo de MVP' : `${EMOJIS.LACO_ROSA} Ranking Feminino` })
            .setTimestamp();
    }
}

export const mvpService = new MvpService();
