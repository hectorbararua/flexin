import { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { CUSTOM_IDS, MENU_OPTIONS } from '../constants';

export class ComponentBuilder {
    static buildSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(CUSTOM_IDS.SELECT)
            .setPlaceholder('Selecione uma opção');

        MENU_OPTIONS.forEach(option => {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(option.label)
                    .setDescription(option.description)
                    .setValue(option.value)
                    .setEmoji(option.emoji)
            );
        });

        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    }

    static buildWhitelistButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.WHITELIST_ADD)
                .setLabel('Add Id')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.WHITELIST_REMOVE)
                .setLabel('Remove Id')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.WHITELIST_LIST)
                .setLabel('Listar Id')
                .setStyle(ButtonStyle.Secondary)
        );
    }
}

