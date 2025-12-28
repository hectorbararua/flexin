import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { BAN_CUSTOM_IDS } from './constants';

export class BanButtonBuilder {
    static buildPanelButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_ADD)
                    .setLabel('➕ Adicionar')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_REMOVE)
                    .setLabel('➖ Remover')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_LIST)
                    .setLabel('📋 Listar')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildAddModal(): ModalBuilder {
        const userInput = new TextInputBuilder()
            .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_USER_INPUT)
            .setLabel('ID do Usuário')
            .setPlaceholder('Digite o ID do usuário...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(17)
            .setMaxLength(20);

        const reasonInput = new TextInputBuilder()
            .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_REASON_INPUT)
            .setLabel('Motivo')
            .setPlaceholder('Digite o motivo da blacklist...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(userInput);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);

        return new ModalBuilder()
            .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_ADD_MODAL)
            .setTitle('Adicionar à Blacklist')
            .addComponents(row1, row2);
    }

    static buildRemoveModal(): ModalBuilder {
        const userInput = new TextInputBuilder()
            .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_USER_INPUT)
            .setLabel('ID do Usuário')
            .setPlaceholder('Digite o ID do usuário...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(17)
            .setMaxLength(20);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(userInput);

        return new ModalBuilder()
            .setCustomId(BAN_CUSTOM_IDS.BLACKLIST_REMOVE_MODAL)
            .setTitle('Remover da Blacklist')
            .addComponents(row);
    }
}

