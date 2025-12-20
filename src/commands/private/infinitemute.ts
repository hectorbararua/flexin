import { Command } from "../../structs/types/command";
import { CommandInteraction, GuildMember, ApplicationCommandType, PermissionsBitField } from "discord.js";
import fs from "fs";
import path from "path";

const infiniteMuteFilePath = path.join(__dirname, "../../data/infiniteMute.json");
function loadInfiniteMuteList(): string[] {
    if (fs.existsSync(infiniteMuteFilePath)) {
        const data = fs.readFileSync(infiniteMuteFilePath, "utf8");
        return JSON.parse(data);
    }
    return [];
}
function saveInfiniteMuteList(list: string[]) {
    fs.writeFileSync(infiniteMuteFilePath, JSON.stringify(list, null, 2));
}
let infiniteMuteList = loadInfiniteMuteList();
const allowedUserIds = ['382357343834210306', '384515909093425153'];

export default new Command({
    name: "infinitemute",
    description: "Mutar um usuário infinitamente (voz e texto)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário a ser mutado",
            type: 6, // USER
            required: true,
        },
    ],
    async run({ interaction, options }) {
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "Você não tem permissão para usar este comando.", ephemeral: true });
        }
        const userOption = options.get('usuario');
        const user = userOption?.user;
        if (!user) return interaction.reply({ content: "Usuário não encontrado.", ephemeral: true });
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "Comando só pode ser usado em servidores.", ephemeral: true });
        const member = guild.members.cache.get(user.id) as GuildMember;
        if (!member) return interaction.reply({ content: "Usuário não está no servidor.", ephemeral: true });
        if (!infiniteMuteList.includes(user.id)) {
            infiniteMuteList.push(user.id);
            saveInfiniteMuteList(infiniteMuteList);
        }
        if (member.voice.channel) {
            await member.voice.setMute(true, "Infinite mute");
        }
        for (const channel of guild.channels.cache.values()) {
            if ((channel.type === 0 || channel.type === 5) && 'permissionOverwrites' in channel) {
                await channel.permissionOverwrites.edit(user.id, { SendMessages: false });
            }
        }
        await interaction.reply({ content: `Usuário ${user} foi infinite muted.`, ephemeral: true });
    },
});
