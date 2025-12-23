import { ApplicationCommandType, Collection } from 'discord.js';
import { Command } from '../../structs/types/command';
import { PainelEmbedBuilder, ComponentBuilder } from './builders';
import { ButtonHandlers, ModalHandlers } from './handlers';
import { CUSTOM_IDS } from './constants';

export default new Command({
    name: 'paineltutorial',
    description: 'Tutorial - Conectar token e acessar CL/Call',
    type: ApplicationCommandType.ChatInput,
    
    async run({ interaction }) {
        const embed = PainelEmbedBuilder.buildPainelEmbed();
        const buttons = ComponentBuilder.buildAllButtons();
        
        await interaction.reply({
            embeds: [embed],
            components: buttons
        });
    },
    
    buttons: new Collection([
        [CUSTOM_IDS.BUTTON_TUTORIAL_IPHONE, (i) => ButtonHandlers.handleTutorialIphone(i)],
        [CUSTOM_IDS.BUTTON_TUTORIAL_PC, (i) => ButtonHandlers.handleTutorialPC(i)],
        [CUSTOM_IDS.BUTTON_TUTORIAL_ANDROID, (i) => ButtonHandlers.handleTutorialAndroid(i)],
        [CUSTOM_IDS.BUTTON_TOKEN, (i) => ButtonHandlers.handleToken(i)],
        [CUSTOM_IDS.BUTTON_STATUS, (i) => ButtonHandlers.handleStatus(i)]
    ]),
    
    modals: new Collection([
        [CUSTOM_IDS.MODAL_TOKEN, (i) => ModalHandlers.handleToken(i)]
    ])
});
