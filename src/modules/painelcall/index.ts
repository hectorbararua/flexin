import { ApplicationCommandType, Collection } from 'discord.js';
import { Command } from '../../structs/types/command';
import { PainelEmbedBuilder, ComponentBuilder } from './builders';
import { selectHandler, handleCall, handleCallMuted, coleiraHandler } from './handlers';
import { CUSTOM_IDS } from './constants';

const embedBuilder = new PainelEmbedBuilder();
const componentBuilder = new ComponentBuilder();

export default new Command({
    name: 'painelcall',
    description: 'Painel Call - Entrar e gerenciar chamadas de voz',
    type: ApplicationCommandType.ChatInput,
    
    async run({ interaction }) {
        const embed = embedBuilder.buildPainelEmbed();
        const selectMenu = componentBuilder.buildSelectMenu();
        
        await interaction.reply({
            embeds: [embed],
            components: [selectMenu]
        });
    },
    
    selects: new Collection([
        [CUSTOM_IDS.SELECT, selectHandler.handle.bind(selectHandler)]
    ]),
    
    modals: new Collection([
        [CUSTOM_IDS.MODAL_CALL, handleCall],
        [CUSTOM_IDS.MODAL_CALL_MUTED, handleCallMuted],
        [CUSTOM_IDS.MODAL_COLEIRA, (i) => coleiraHandler.handle(i)]
    ])
});
