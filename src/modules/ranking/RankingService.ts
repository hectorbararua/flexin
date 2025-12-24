import { Client, DiscordAPIError, EmbedBuilder, GuildMember } from 'discord.js';
import { RankingRepository } from './RankingRepository';
import { COLORS } from '../../config';

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

    addPoints(playerId: string, points: number): void {
        this.repository.addPoints(playerId, points);
    }

    addWinnerPoints(playerIds: string[]): void {
        playerIds.forEach(id => this.repository.addPoints(id, 10));
    }

    addMvpPoints(playerId: string): void {
        this.repository.addPoints(playerId, 5);
    }

    async generateRankingPage(
        page: number, 
        client: Client, 
        guildId: string
    ): Promise<{ embed: EmbedBuilder; totalPages: number; nextPageDisabled: boolean }> {
        const entries = this.repository.getSortedRanking();

        const startIndex = (page - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageEntries = entries.slice(startIndex, endIndex);

        const topPlayers = await this.fetchPlayerDisplayNames(pageEntries, client, guildId);

        const embed = this.buildRankingEmbed(topPlayers, startIndex, endIndex, entries.length);
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
                console.error('Error fetching member:', error);
            }
        }

        return results;
    }

    private buildRankingEmbed(
        players: PlayerRanking[],
        startIndex: number,
        endIndex: number,
        totalEntries: number
    ): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('Ranking de Pontos')
            .setDescription(`Top ${startIndex + 1} a ${Math.min(endIndex, totalEntries)} jogadores com mais pontos:`)
            .setColor(COLORS.PRIMARY as `#${string}`)
            .addFields(
                ...players.map((player, index) => ({
                    name: `${startIndex + index + 1}. ${player.displayName || 'Desconhecido'}`,
                    value: `Pontos: ${player.points}`,
                    inline: false,
                }))
            );
    }
}

