import { CommandInteractionOptionResolver, ChatInputCommandInteraction } from "discord.js";
import { client } from "../..";
import { Event } from "../../structs/types/events"

export default new Event({
    name: 'interactionCreate',
    run(interaction) {
        if(!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if(!command) return;

        // Só passa options se for um comando de chat input
        if(interaction.isChatInputCommand()) {
            const options = interaction.options as CommandInteractionOptionResolver;
            command.run({ client, interaction, options });
        } else {
            // Para outros tipos de comando, passa options vazio
            command.run({ client, interaction, options: {} as CommandInteractionOptionResolver });
        }
    }
})