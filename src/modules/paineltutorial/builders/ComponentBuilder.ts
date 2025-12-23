import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CUSTOM_IDS, BUTTON_LABELS } from '../constants';

export class ComponentBuilder {
    static buildAllButtons(): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.BUTTON_TOKEN)
                .setLabel(BUTTON_LABELS.TOKEN)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.BUTTON_STATUS)
                .setLabel(BUTTON_LABELS.STATUS)
                .setStyle(ButtonStyle.Primary),
            this.createButton(CUSTOM_IDS.BUTTON_TUTORIAL_IPHONE, BUTTON_LABELS.TUTORIAL_IPHONE),
            this.createButton(CUSTOM_IDS.BUTTON_TUTORIAL_PC, BUTTON_LABELS.TUTORIAL_PC),
            this.createButton(CUSTOM_IDS.BUTTON_TUTORIAL_ANDROID, BUTTON_LABELS.TUTORIAL_ANDROID)
        );
        return [row1];
    }

    static buildDiscordLinkButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Abrir Discord Web')
                .setURL('https://discord.com/app')
                .setStyle(ButtonStyle.Link)
        );
    }

    private static createButton(customId: string, label: string): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary);
    }
}
