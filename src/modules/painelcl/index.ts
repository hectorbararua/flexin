import { ApplicationCommandType, Collection } from 'discord.js';
import { Command } from '../../structs/types/command';
import { PainelEmbedBuilder, ComponentBuilder } from './builders';
import { SelectHandler, ModalHandlers, ButtonHandlers } from './handlers';
import { CUSTOM_IDS } from './constants';

export default new Command({
    name: 'painelcl',
    description: 'Painel Clear - Limpar e gerenciar DMs',
    type: ApplicationCommandType.ChatInput,
    
    async run({ interaction }) {
        const embed = PainelEmbedBuilder.buildPainelEmbed();
        const selectMenu = ComponentBuilder.buildSelectMenu();
        
        await interaction.reply({
            embeds: [embed],
            components: [selectMenu]
        });
    },
    
    selects: new Collection([
        [CUSTOM_IDS.SELECT, SelectHandler.handle.bind(SelectHandler)]
    ]),
    
    buttons: new Collection([
        [CUSTOM_IDS.WHITELIST_ADD, ButtonHandlers.handleWhitelistAdd],
        [CUSTOM_IDS.WHITELIST_REMOVE, ButtonHandlers.handleWhitelistRemove],
        [CUSTOM_IDS.WHITELIST_LIST, ButtonHandlers.handleWhitelistList]
    ]),
    
    modals: new Collection([
        [CUSTOM_IDS.MODAL_CL, ModalHandlers.handleCL],
        [CUSTOM_IDS.MODAL_CL_SERVIDOR, ModalHandlers.handleCLServidor],
        [CUSTOM_IDS.MODAL_RP, ModalHandlers.handleRichPresence],
        [CUSTOM_IDS.MODAL_WHITELIST_ADD, ModalHandlers.handleWhitelistAdd],
        [CUSTOM_IDS.MODAL_WHITELIST_REMOVE, ModalHandlers.handleWhitelistRemove],
        [CUSTOM_IDS.MODAL_CLONAR, ModalHandlers.handleClonar]
    ])
});

