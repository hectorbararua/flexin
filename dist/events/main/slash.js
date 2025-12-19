"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const events_1 = require("../../structs/types/events");
exports.default = new events_1.Event({
    name: 'interactionCreate',
    run(interaction) {
        if (!interaction.isCommand())
            return;
        const command = __1.client.commands.get(interaction.commandName);
        if (!command)
            return;
        // Só passa options se for um comando de chat input
        if (interaction.isChatInputCommand()) {
            const options = interaction.options;
            command.run({ client: __1.client, interaction, options });
        }
        else {
            // Para outros tipos de comando, passa options vazio
            command.run({ client: __1.client, interaction, options: {} });
        }
    }
});
