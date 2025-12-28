import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { VERIFICATION_CUSTOM_IDS, VERIFICATION_MESSAGES } from './constants';

export interface VerifierOption {
    id: string;
    username: string;
    displayName: string;
}

export class VerificationButtonBuilder {
    static buildVerifyButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(VERIFICATION_CUSTOM_IDS.VERIFY_BUTTON)
                    .setLabel(VERIFICATION_MESSAGES.VERIFY_BUTTON)
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildVerifierSelect(verifiers: VerifierOption[]): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = verifiers.map(verifier =>
            new StringSelectMenuOptionBuilder()
                .setLabel(verifier.displayName)
                .setDescription(`@${verifier.username}`)
                .setValue(verifier.id)
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(VERIFICATION_CUSTOM_IDS.VERIFIER_SELECT)
                    .setPlaceholder(VERIFICATION_MESSAGES.SELECT_PLACEHOLDER)
                    .addOptions(options.slice(0, 25)),
            ],
        });
    }

    static buildAnswerModal(verifierId: string): ModalBuilder {
        const answerInput = new TextInputBuilder()
            .setCustomId(VERIFICATION_CUSTOM_IDS.ANSWER_INPUT)
            .setLabel(VERIFICATION_MESSAGES.QUESTION)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(VERIFICATION_MESSAGES.MODAL_PLACEHOLDER)
            .setRequired(true)
            .setMaxLength(100);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(answerInput);

        return new ModalBuilder()
            .setCustomId(`${VERIFICATION_CUSTOM_IDS.ANSWER_MODAL}_${verifierId}`)
            .setTitle(VERIFICATION_MESSAGES.MODAL_TITLE)
            .addComponents(row);
    }

    static buildApprovalButtons(requestId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${VERIFICATION_CUSTOM_IDS.APPROVE_BUTTON}_${requestId}`)
                    .setLabel('Aceitar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`${VERIFICATION_CUSTOM_IDS.REJECT_BUTTON}_${requestId}`)
                    .setLabel('Recusar')
                    .setStyle(ButtonStyle.Danger),
            ],
        });
    }
}

