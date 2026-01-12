import {
    Client,
    ButtonInteraction,
    ModalSubmitInteraction,
    TextChannel,
} from 'discord.js';
import { feedbackRepository } from './FeedbackRepository';
import { FeedbackEmbedBuilder } from './FeedbackEmbedBuilder';
import { FeedbackButtonBuilder } from './FeedbackButtonBuilder';
import {
    FEEDBACK_CHANNEL_IDS,
    FEEDBACK_CUSTOM_IDS,
    FEEDBACK_MESSAGES,
    getRatingDisplay,
} from './constants';
import {
    Feedback,
    FeedbackRating,
    extractFeedbackUserInfo,
    generateFeedbackId,
} from './types';
import { coachRepository } from '../coach/CoachRepository';

export class FeedbackService {
    private pendingRatings: Map<string, { coachId: string; rating: FeedbackRating }> = new Map();

    async handleAvaliarButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const coachId = interaction.customId.replace(FEEDBACK_CUSTOM_IDS.BTN_AVALIAR, '');
            const studentId = interaction.user.id;

            const coach = coachRepository.getCoach(coachId);
            if (!coach) {
                await interaction.reply({ content: FEEDBACK_MESSAGES.ERROR_COACH_NOT_FOUND, flags: 64 });
                return;
            }

            const isCurrentStudent = coach.studentIds.includes(studentId);
            const wasStudent = coachRepository.wasStudentOf(studentId, coachId);

            if (!isCurrentStudent && !wasStudent) {
                await interaction.reply({ content: FEEDBACK_MESSAGES.ERROR_NOT_STUDENT, flags: 64 });
                return;
            }

            const existingFeedback = feedbackRepository.getFeedbackByStudentAndCoach(studentId, coachId);

            if (existingFeedback) {
                const embed = FeedbackEmbedBuilder.buildUpdateConfirmEmbed(coach.displayName, existingFeedback);
                const buttons = FeedbackButtonBuilder.buildUpdateConfirmButtons(coachId);

                await interaction.reply({ embeds: [embed], components: [buttons], flags: 64 });
                return;
            }

            const embed = FeedbackEmbedBuilder.buildRatingEmbed(coach.displayName);
            const buttons = FeedbackButtonBuilder.buildRatingButtons(coachId);

            await interaction.reply({ embeds: [embed], components: [buttons], flags: 64 });
        } catch {
            await interaction.reply({ content: FEEDBACK_MESSAGES.ERROR_GENERIC, flags: 64 }).catch(() => { });
        }
    }

    async handleUpdateYesButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const coachId = interaction.customId.replace(FEEDBACK_CUSTOM_IDS.BTN_UPDATE_YES, '');
            const coach = coachRepository.getCoach(coachId);

            if (!coach) {
                await interaction.update({ content: FEEDBACK_MESSAGES.ERROR_COACH_NOT_FOUND, embeds: [], components: [] });
                return;
            }

            const embed = FeedbackEmbedBuilder.buildRatingEmbed(coach.displayName);
            const buttons = FeedbackButtonBuilder.buildRatingButtons(coachId);

            await interaction.update({ embeds: [embed], components: [buttons] });
        } catch { }
    }

    async handleUpdateNoButton(interaction: ButtonInteraction): Promise<void> {
        try {
            await interaction.update({
                content: `${FEEDBACK_MESSAGES.ERROR_GENERIC.replace('Ocorreu um erro', 'Avaliação cancelada')}`,
                embeds: [],
                components: [],
            });
        } catch { }
    }

    async handleRatingButton(interaction: ButtonInteraction, rating: FeedbackRating): Promise<void> {
        try {
            const customIdBase = `${FEEDBACK_CUSTOM_IDS.BTN_RATING_1}`.replace('1_', `${rating}_`);
            const coachId = interaction.customId.replace(customIdBase, '');

            const coach = coachRepository.getCoach(coachId);
            if (!coach) {
                await interaction.reply({ content: FEEDBACK_MESSAGES.ERROR_COACH_NOT_FOUND, flags: 64 });
                return;
            }

            this.pendingRatings.set(interaction.user.id, { coachId, rating });

            const modal = FeedbackButtonBuilder.buildCommentModal(coachId, rating, coach.displayName);
            await interaction.showModal(modal);
        } catch { }
    }

    async handleCommentModal(interaction: ModalSubmitInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const customIdParts = interaction.customId
                .replace(FEEDBACK_CUSTOM_IDS.MODAL_COMMENT, '')
                .split('_');

            const coachId = customIdParts[0];
            const rating = parseInt(customIdParts[1]) as FeedbackRating;

            const comment = interaction.fields.getTextInputValue(FEEDBACK_CUSTOM_IDS.INPUT_COMMENT) || '';

            const coach = coachRepository.getCoach(coachId);
            if (!coach) {
                await interaction.editReply({ content: FEEDBACK_MESSAGES.ERROR_COACH_NOT_FOUND });
                return;
            }

            const userInfo = extractFeedbackUserInfo(interaction.user);
            const existingFeedback = feedbackRepository.getFeedbackByStudentAndCoach(interaction.user.id, coachId);

            let feedback: Feedback;
            let isUpdate = false;

            if (existingFeedback) {
                feedback = feedbackRepository.updateFeedback(existingFeedback.id, {
                    rating,
                    comment,
                    studentDisplayName: userInfo.displayName,
                    studentAvatarUrl: userInfo.avatarUrl,
                })!;
                isUpdate = true;
            } else {
                feedback = {
                    id: generateFeedbackId(),
                    odCoachId: coachId,
                    odStudentId: interaction.user.id,
                    studentUsername: userInfo.username,
                    studentDisplayName: userInfo.displayName,
                    studentAvatarUrl: userInfo.avatarUrl,
                    rating,
                    comment,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                feedbackRepository.createFeedback(feedback);
            }

            await this.sendReviewToChannel(interaction.client, feedback, coach.displayName, isUpdate);
            await this.updateCoachDisplayEmbed(interaction.client, coachId);

            const successMessage = isUpdate
                ? FEEDBACK_MESSAGES.SUCCESS_FEEDBACK_UPDATED
                : FEEDBACK_MESSAGES.SUCCESS_FEEDBACK_SENT;

            await interaction.editReply({ content: successMessage });
            this.pendingRatings.delete(interaction.user.id);
        } catch {
            await interaction.editReply({ content: FEEDBACK_MESSAGES.ERROR_GENERIC }).catch(() => { });
        }
    }

    private async sendReviewToChannel(
        client: Client,
        feedback: Feedback,
        coachDisplayName: string,
        isUpdate: boolean
    ): Promise<void> {
        try {
            const channel = await client.channels.fetch(FEEDBACK_CHANNEL_IDS.REVIEWS_CHANNEL) as TextChannel;
            if (!channel) return;

            const embed = FeedbackEmbedBuilder.buildReviewEmbed(feedback, coachDisplayName, isUpdate);
            await channel.send({ embeds: [embed] });
        } catch { }
    }

    async updateCoachDisplayEmbed(client: Client, coachId: string): Promise<void> {
        // Integrado no CoachService
    }

    getCoachStats(coachId: string) {
        return feedbackRepository.getCoachFeedbackStats(coachId);
    }

    getCoachRatingDisplay(coachId: string): string {
        const stats = feedbackRepository.getCoachFeedbackStats(coachId);
        if (stats.totalReviews === 0) return '';
        return getRatingDisplay(stats.averageRating, stats.totalReviews);
    }
}

export const feedbackService = new FeedbackService();
