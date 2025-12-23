import { EmbedBuilder } from 'discord.js';
import { UserCallData } from '../callTime/types';
import { IRankingEmbedBuilder } from './types';
import { MEDALS, RANKING_MESSAGES, RANKING_COLORS } from './constants';

export class RankingEmbedBuilder implements IRankingEmbedBuilder {
    build(ranking: UserCallData[], formatTime: (ms: number) => string): EmbedBuilder {
        const description = this.buildDescription(ranking, formatTime);
        const now = new Date();

        return new EmbedBuilder()
            .setTitle(RANKING_MESSAGES.TITLE)
            .setDescription(description)
            .setColor(RANKING_COLORS.GOLD)
            .setFooter({ 
                text: `${RANKING_MESSAGES.FOOTER} • ${now.toLocaleString('pt-BR')}` 
            })
            .setTimestamp();
    }

    private buildDescription(ranking: UserCallData[], formatTime: (ms: number) => string): string {
        if (ranking.length === 0) {
            return RANKING_MESSAGES.EMPTY;
        }

        const lines = ranking.map((user, index) => 
            this.buildUserLine(user, index, formatTime)
        );

        return lines.join('\n');
    }

    private buildUserLine(
        user: UserCallData, 
        index: number, 
        formatTime: (ms: number) => string
    ): string {
        const position = this.getPositionDisplay(index);
        const time = formatTime(user.totalTime);

        return `${position} <@${user.odiscordUserId}> • \`${time}\``;
    }

    private getPositionDisplay(index: number): string {
        return MEDALS[index] ?? `**${index + 1}º**`;
    }
}

export const createRankingEmbedBuilder = (): IRankingEmbedBuilder => {
    return new RankingEmbedBuilder();
};

