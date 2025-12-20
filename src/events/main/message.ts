import { Message } from "discord.js";
import { Event } from "../../structs/types/events";
import { client } from "../..";

export default new Event({
    name: "messageCreate",
    run(message: Message) {
        if (message.author.bot) return;
        
        if (!message.content.startsWith("auge:")) return;
        
        const args = message.content.slice(5).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        if (!commandName) return;
        
        const command = client.commands.get(commandName);
        
        if (command) {
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
            
            command.run({ 
                client, 
                interaction: fakeInteraction as any, 
                options: {} as any 
            });
        }
    }
});
