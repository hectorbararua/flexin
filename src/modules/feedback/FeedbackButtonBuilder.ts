import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { FEEDBACK_CUSTOM_IDS, FEEDBACK_MESSAGES, LIKE_EMOJI_ID } from './constants';
import { FeedbackRating } from './types';

export class FeedbackButtonBuilder {
    static buildAvaliarButton(coachId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_AVALIAR}${coachId}`)
                .setLabel('Avaliar')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary)
        );
    }

    static buildRatingButtons(coachId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_RATING_1}${coachId}`)
                .setLabel('1')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_RATING_2}${coachId}`)
                .setLabel('2')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_RATING_3}${coachId}`)
                .setLabel('3')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_RATING_4}${coachId}`)
                .setLabel('4')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_RATING_5}${coachId}`)
                .setLabel('5')
                .setEmoji({ id: LIKE_EMOJI_ID })
                .setStyle(ButtonStyle.Secondary),
        );
    }

    static buildUpdateConfirmButtons(coachId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`${FEEDBACK_CUSTOM_IDS.BTN_UPDATE_YES}${coachId}`)
                .setLabel(FEEDBACK_MESSAGES.BTN_UPDATE_YES)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(FEEDBACK_CUSTOM_IDS.BTN_UPDATE_NO)
                .setLabel(FEEDBACK_MESSAGES.BTN_UPDATE_NO)
                .setStyle(ButtonStyle.Danger),
        );
    }

    static buildCommentModal(coachId: string, rating: FeedbackRating, coachDisplayName: string): ModalBuilder {
        const modal = new ModalBuilder()
            .setCustomId(`${FEEDBACK_CUSTOM_IDS.MODAL_COMMENT}${coachId}_${rating}`)
            .setTitle(`💬 Avaliar ${coachDisplayName}`);

        const ratingText = `${'♥'.repeat(rating)}${'○'.repeat(5 - rating)}`;

        const commentInput = new TextInputBuilder()
            .setCustomId(FEEDBACK_CUSTOM_IDS.INPUT_COMMENT)
            .setLabel(`Sua avaliação: ${ratingText}`)
            .setPlaceholder(FEEDBACK_MESSAGES.DESC_COMMENT_PLACEHOLDER)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(commentInput);
        modal.addComponents(row);

        return modal;
    }
}
