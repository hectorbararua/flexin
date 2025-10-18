import { Message } from "discord.js";
import { Event } from "../../structs/types/events";
import { client } from "../..";

export default new Event({
    name: "messageCreate",
    run(message: Message) {
        // Ignora mensagens de bots
        if (message.author.bot) return;
        
        // Verifica se a mensagem começa com o prefixo "hit:"
        if (!message.content.startsWith("hit:")) return;
        
        // Remove o prefixo e pega o comando
        const args = message.content.slice(4).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        if (!commandName) return;
        
        // Procura pelo comando
        const command = client.commands.get(commandName);
        
        if (command) {
            // Cria uma interação fake para compatibilidade
            const fakeInteraction = {
                user: message.author,
                member: message.member,
                guild: message.guild,
                channel: message.channel,
                reply: async (options: any) => {
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
                client, 
                interaction: fakeInteraction as any, 
                options: {} as any 
            });
        }
    }
});
