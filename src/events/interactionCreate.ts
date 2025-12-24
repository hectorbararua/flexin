import { CommandInteractionOptionResolver } from 'discord.js';
import { Event } from '../core/types';
import { client } from '..';
import { handleVencedorDynamic, handleSalaDynamic, handleSalaModal } from '../modules/match/TrainingCommand';

export default new Event({
    name: 'interactionCreate',
    run(interaction) {
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('treino_modal_sala_')) {
                handleSalaModal(interaction);
                return;
            }
            client.modals.get(interaction.customId)?.(interaction);
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('treino_vencedor_')) {
                handleVencedorDynamic(interaction);
                return;
            }
            if (interaction.customId.startsWith('treino_sala_')) {
                handleSalaDynamic(interaction);
                return;
            }
            client.buttons.get(interaction.customId)?.(interaction);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            client.selects.get(interaction.customId)?.(interaction);
            return;
        }

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            if (interaction.isChatInputCommand()) {
                const options = interaction.options as CommandInteractionOptionResolver;
                command.run({ client, interaction, options });
            } else {
                command.run({ client, interaction, options: {} as CommandInteractionOptionResolver });
            }
        }
    },
});

