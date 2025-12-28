import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { NUKE_CONFIG, NUKE_MESSAGES, NUKE_CUSTOM_IDS } from './constants';

export class NukeEmbedBuilder {
    static buildConfirmEmbed(channelName: string, isConfigured: boolean, purpose?: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(NUKE_CONFIG.embedColor)
            .setTitle(NUKE_MESSAGES.CONFIRM_TITLE)
            .setDescription(NUKE_MESSAGES.CONFIRM_DESCRIPTION(channelName, isConfigured, purpose))
            .setTimestamp();
    }

    static buildConfirmButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(NUKE_CUSTOM_IDS.CONFIRM)
                .setLabel(NUKE_MESSAGES.CONFIRM_BUTTON)
                .setStyle(ButtonStyle.Danger)
                .setEmoji('💥'),
            new ButtonBuilder()
                .setCustomId(NUKE_CUSTOM_IDS.CANCEL)
                .setLabel(NUKE_MESSAGES.CANCEL_BUTTON)
                .setStyle(ButtonStyle.Secondary)
        );
    }
}

