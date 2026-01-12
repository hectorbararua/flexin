import { Client, DiscordAPIError, EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { RankingRepository, RankingType } from './RankingRepository';
import { COLORS, EMOJIS, channelConfig } from '../../config';

interface PlayerRanking {
    userId: string;
    points: number;
    displayName: string;
}

export class RankingService {
    private repository: RankingRepository;
    private pageSize = 10;

    constructor() {
        this.repository = new RankingRepository();
    }

    // Helper para pegar emojis baseado no tipo
    private getEmojis(type: RankingType) {
        if (type === 'feminino') {
            return {
                icon: EMOJIS.LACO_ROSA,
                ponto: EMOJIS.PONTO_ROSA,
                color: COLORS.FEMININO,
            };
        }
        return {
            icon: '🎮',
            ponto: EMOJIS.PONTO_ROXO,
            color: COLORS.PRIMARY,
        };
    }

    addPoints(playerId: string, points: number, type: RankingType = 'normal'): void {
        this.repository.addPoints(playerId, points, type);
    }

    addWinnerPoints(playerIds: string[], type: RankingType = 'normal'): void {
        playerIds.forEach(id => this.repository.addPoints(id, 10, type));
    }

    addMvpPoints(playerId: string, type: RankingType = 'normal'): void {
        this.repository.addPoints(playerId, 5, type);
    }

    async sendRankingUpdate(client: Client, type: RankingType = 'normal'): Promise<void> {
        const guild = client.guilds.cache.get(channelConfig.guild.mainGuildId);
        if (!guild) return;

        const channelId = type === 'feminino' 
            ? channelConfig.rankingFeminino?.rankingPontosChannelId 
            : channelConfig.ranking.rankingPontosChannelId;
        
        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId) as TextChannel;
        if (!channel) return;

        const embed = await this.buildFullRankingEmbed(guild, type);
        const { icon } = this.getEmojis(type);
        const embedTitle = type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Ranking de Pontos (Feminino)` 
            : '🎮 Ranking de Pontos';

        try {
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
        } catch (error) {
            console.error(`[RankingService] Erro ao atualizar ranking ${type}:`, error);
        }
    }

    private async buildFullRankingEmbed(guild: Guild, type: RankingType = 'normal'): Promise<EmbedBuilder> {
        const { icon, ponto, color } = this.getEmojis(type);
        const entries = this.repository.getSortedRanking(type);
        const top20 = entries.slice(0, 20);
        
        const title = type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Ranking de Pontos (Feminino)` 
            : '🎮 Ranking de Pontos';

        const rankingLines = await Promise.all(
            top20.map(async (player, index) => {
                let medal: string;
                if (type === 'feminino') {
                    medal = index === 0 ? `${EMOJIS.LACO_ROSA}` : index === 1 ? `${EMOJIS.PONTO_ROSA}` : index === 2 ? `${EMOJIS.PONTO_ROSA}` : `${ponto}`;
                } else {
                    medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                }

                let displayName = 'Desconhecido';
                try {
                    const member = await guild.members.fetch(player.userId);
                    displayName = member.displayName;
                } catch {}

                return type === 'feminino'
                    ? `${medal} **${displayName}** — ${player.points} pontos`
                    : `${medal} **${displayName}** — ${player.points} pontos`;
            })
        );

        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(
                rankingLines.length > 0
                    ? rankingLines.join('\n')
                    : 'Nenhum jogador no ranking ainda.'
            )
            .setColor(color as `#${string}`)
            .setFooter({ text: 'Atualizado automaticamente após cada treino' })
            .setTimestamp();
    }

    async generateRankingPage(
        page: number, 
        client: Client, 
        guildId: string,
        type: RankingType = 'normal'
    ): Promise<{ embed: EmbedBuilder; totalPages: number; nextPageDisabled: boolean }> {
        const entries = this.repository.getSortedRanking(type);

        const startIndex = (page - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageEntries = entries.slice(startIndex, endIndex);

        const topPlayers = await this.fetchPlayerDisplayNames(pageEntries, client, guildId);

        const embed = this.buildRankingEmbed(topPlayers, startIndex, endIndex, entries.length, type);
        const totalPages = Math.ceil(entries.length / this.pageSize);
        const nextPageDisabled = topPlayers.length < this.pageSize;

        return { embed, totalPages, nextPageDisabled };
    }

    private async fetchPlayerDisplayNames(
        players: Array<{ userId: string; points: number }>,
        client: Client,
        guildId: string
    ): Promise<PlayerRanking[]> {
        const results: PlayerRanking[] = [];
        const guild = client.guilds.cache.get(guildId);

        if (!guild) return results;

        for (const player of players) {
            try {
                const member = await guild.members.fetch(player.userId);
                if (member) {
                    results.push({
                        ...player,
                        displayName: member.displayName,
                    });
                }
            } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 10007) {
                    continue;
                }
            }
        }

        return results;
    }

    private buildRankingEmbed(
        players: PlayerRanking[],
        startIndex: number,
        endIndex: number,
        totalEntries: number,
        type: RankingType = 'normal'
    ): EmbedBuilder {
        const { icon, ponto, color } = this.getEmojis(type);
        const title = type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Ranking de Pontos (Feminino)` 
            : '🎮 Ranking de Pontos';

        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${ponto} Top ${startIndex + 1} a ${Math.min(endIndex, totalEntries)} jogadores com mais pontos:`)
            .setColor(color as `#${string}`)
            .addFields(
                ...players.map((player, index) => ({
                    name: `${type === 'feminino' ? EMOJIS.PONTO_ROSA : ''} ${startIndex + index + 1}. ${player.displayName || 'Desconhecido'}`,
                    value: `Pontos: ${player.points}`,
                    inline: false,
                }))
            );
    }
}

