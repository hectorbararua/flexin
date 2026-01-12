import { EmbedBuilder } from 'discord.js';
import { EMOJIS } from '../../config';
import { Feedback, CoachFeedbackStats } from './types';
import {
    FEEDBACK_CONFIG,
    FEEDBACK_MESSAGES,
    getRatingLikes,
} from './constants';

export class FeedbackEmbedBuilder {
    static buildRatingEmbed(coachDisplayName: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(FEEDBACK_CONFIG.embedColor as `#${string}`)
            .setTitle(FEEDBACK_MESSAGES.TITLE_RATE_COACH)
            .setDescription([
                `${EMOJIS.SETINHA_ROXA} **Avaliar ${coachDisplayName}**`,
                '',
                FEEDBACK_MESSAGES.DESC_RATE_QUESTION,
                '',
                `${EMOJIS.PONTO_ROXO} Escolha de **1** a **5** likes abaixo:`,
            ].join('\n'))
            .setFooter({ text: FEEDBACK_CONFIG.footerText });
    }

    static buildUpdateConfirmEmbed(coachDisplayName: string, existingFeedback: Feedback): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(FEEDBACK_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.PONTO_ROXO} Atualizar Avaliação`)
            .setDescription([
                `${EMOJIS.SETINHA_ROXA} **Você já avaliou ${coachDisplayName}**`,
                '',
                `${EMOJIS.PONTO_ROXO} Sua avaliação atual:`,
                `${getRatingLikes(existingFeedback.rating)}`,
                '',
                existingFeedback.comment ? `💬 *"${existingFeedback.comment}"*` : '',
                '',
                FEEDBACK_MESSAGES.CONFIRM_UPDATE,
            ].join('\n'))
            .setFooter({ text: FEEDBACK_CONFIG.footerText });
    }

    static buildReviewEmbed(feedback: Feedback, coachDisplayName: string, isUpdate: boolean = false): EmbedBuilder {
        const title = isUpdate
            ? FEEDBACK_MESSAGES.TITLE_UPDATED_REVIEW
            : FEEDBACK_MESSAGES.TITLE_NEW_REVIEW;

        const embed = new EmbedBuilder()
            .setColor(FEEDBACK_CONFIG.embedColor as `#${string}`)
            .setTitle(title)
            .setThumbnail(feedback.studentAvatarUrl)
            .setDescription([
                `${EMOJIS.SHIELD} **Treinador:** <@${feedback.odCoachId}>`,
                `${EMOJIS.USERS} **Por:** <@${feedback.odStudentId}>`,
                '',
                `${EMOJIS.PONTO_ROXO} **Nota:** ${getRatingLikes(feedback.rating)}`,
            ].join('\n'))
            .setFooter({ text: FEEDBACK_CONFIG.footerText })
            .setTimestamp();

        if (feedback.comment) {
            embed.addFields({
                name: `${EMOJIS.PONTO_ROXO} Comentário`,
                value: `*"${feedback.comment}"*`,
                inline: false,
            });
        }

        return embed;
    }

    static buildCoachStatsEmbed(
        coachDisplayName: string,
        coachAvatarUrl: string,
        stats: CoachFeedbackStats,
        recentFeedbacks: Feedback[]
    ): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(FEEDBACK_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SHIELD} Avaliações de ${coachDisplayName}`)
            .setThumbnail(coachAvatarUrl)
            .setDescription([
                `${EMOJIS.SETINHA_ROXA} **Média:** ${getRatingLikes(Math.round(stats.averageRating))}`,
                `${EMOJIS.PONTO_ROXO} **Total:** ${stats.totalReviews} avaliações`,
                '',
                `${EMOJIS.PONTO_ROXO} **Distribuição:**`,
                `${EMOJIS.PONTO_ROXO} 5 likes: ${stats.ratings[5]}`,
                `${EMOJIS.PONTO_ROXO} 4 likes: ${stats.ratings[4]}`,
                `${EMOJIS.PONTO_ROXO} 3 likes: ${stats.ratings[3]}`,
                `${EMOJIS.PONTO_ROXO} 2 likes: ${stats.ratings[2]}`,
                `${EMOJIS.PONTO_ROXO} 1 like: ${stats.ratings[1]}`,
            ].join('\n'))
            .setFooter({ text: FEEDBACK_CONFIG.footerText })
            .setTimestamp();

        if (recentFeedbacks.length > 0) {
            const recentComments = recentFeedbacks
                .filter(f => f.comment)
                .slice(0, 3)
                .map(f => `${getRatingLikes(f.rating)} - *"${f.comment.substring(0, 50)}${f.comment.length > 50 ? '...' : ''}"*`)
                .join('\n');

            if (recentComments) {
                embed.addFields({
                    name: `${EMOJIS.PONTO_ROXO} Últimos comentários`,
                    value: recentComments,
                    inline: false,
                });
            }
        }

        return embed;
    }

    static buildErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(message);
    }

    static buildSuccessEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(message);
    }
}
