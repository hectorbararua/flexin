"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("../../structs/types/command");
const discord_js_1 = require("discord.js");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const infiniteMuteFilePath = path_1.default.join(__dirname, "../../data/infiniteMute.json");
function loadInfiniteMuteList() {
    if (fs_1.default.existsSync(infiniteMuteFilePath)) {
        const data = fs_1.default.readFileSync(infiniteMuteFilePath, "utf8");
        return JSON.parse(data);
    }
    return [];
}
function saveInfiniteMuteList(list) {
    fs_1.default.writeFileSync(infiniteMuteFilePath, JSON.stringify(list, null, 2));
}
let infiniteMuteList = loadInfiniteMuteList();
const allowedUserIds = ['382357343834210306'];
exports.default = new command_1.Command({
    name: "unmute",
    description: "Remover infinite mute de um usuário",
    type: discord_js_1.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "Usuário a ser desmutado",
            type: 6, // USER
            required: true,
        },
    ],
    async run({ interaction, options }) {
        // Verifica se o usuário tem permissão
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "Você não tem permissão para usar este comando.", ephemeral: true });
        }
        const userOption = options.get('usuario');
        const user = userOption?.user;
        if (!user)
            return interaction.reply({ content: "Usuário não encontrado.", ephemeral: true });
        const guild = interaction.guild;
        if (!guild)
            return interaction.reply({ content: "Comando só pode ser usado em servidores.", ephemeral: true });
        const member = guild.members.cache.get(user.id);
        if (!member)
            return interaction.reply({ content: "Usuário não está no servidor.", ephemeral: true });
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
        await interaction.reply({ content: `Usuário ${user} foi desmutado e removido da lista infinite mute.`, ephemeral: true });
    },
});
