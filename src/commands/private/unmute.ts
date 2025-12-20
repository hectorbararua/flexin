import { Command } from "../../structs/types/command";
import { CommandInteraction, GuildMember, ApplicationCommandType, PermissionsBitField } from "discord.js";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const infiniteMuteFilePath = path.join(dataDir, "infiniteMute.json");

function loadInfiniteMuteList(): string[] {
    if (fs.existsSync(infiniteMuteFilePath)) {
        const data = fs.readFileSync(infiniteMuteFilePath, "utf8");
        return JSON.parse(data);
    }
    return [];
}

function saveInfiniteMuteList(list: string[]) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(infiniteMuteFilePath, JSON.stringify(list, null, 2));
}
let infiniteMuteList = loadInfiniteMuteList();
const allowedUserIds = ['382357343834210306'];

export default new Command({
    name: "unmute",
    description: "Remover infinite mute de um usuário",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário a ser desmutado",
            type: 6, // USER
            required: true,
        },
    ],
    async run({ interaction, options }) {
        await interaction.deferReply({ flags: 64 });
        
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.editReply({ content: "Você não tem permissão para usar este comando." });
        }
        const userOption = options.get('usuario');
        const user = userOption?.user;
        if (!user) return interaction.editReply({ content: "Usuário não encontrado." });
        const guild = interaction.guild;
        if (!guild) return interaction.editReply({ content: "Comando só pode ser usado em servidores." });
        const member = guild.members.cache.get(user.id) as GuildMember;
        if (!member) return interaction.editReply({ content: "Usuário não está no servidor." });
        infiniteMuteList = infiniteMuteList.filter(id => id !== user.id);
        saveInfiniteMuteList(infiniteMuteList);
        if (member.voice.channel) {
            await member.voice.setMute(false, "Infinite mute removido");
        }
        for (const channel of guild.channels.cache.values()) {
            if ((channel.type === 0 || channel.type === 5) && 'permissionOverwrites' in channel) {
                await channel.permissionOverwrites.edit(user.id, { SendMessages: null });
            }
        }
        await interaction.editReply({ content: `Usuário ${user} foi desmutado e removido da lista infinite mute.` });
    },
});
