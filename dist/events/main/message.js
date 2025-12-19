"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../../structs/types/events");
const __1 = require("../..");
exports.default = new events_1.Event({
    name: "messageCreate",
    run(message) {
        // Ignora mensagens de bots
        if (message.author.bot)
            return;
        // Verifica se a mensagem começa com o prefixo "auge:"
        if (!message.content.startsWith("auge:"))
            return;
        // Remove o prefixo e pega o comando
        const args = message.content.slice(5).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName)
            return;
        // Procura pelo comando
        const command = __1.client.commands.get(commandName);
        if (command) {
            // Cria uma interação fake para compatibilidade
            const fakeInteraction = {
                user: message.author,
                member: message.member,
                guild: message.guild,
                channel: message.channel,
                reply: async (options) => {
                    if (options.embeds && options.components) {
                        return message.reply({
                            embeds: options.embeds,
                            components: options.components
                        });
                    }
                    return message.reply(options.content || "Comando executado!");
                }
            };
            // Executa o comando
            command.run({
                client: __1.client,
                interaction: fakeInteraction,
                options: {}
            });
        }
    }
});
