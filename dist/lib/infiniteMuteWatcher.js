"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupInfiniteMuteWatcher = setupInfiniteMuteWatcher;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const infiniteMuteFilePath = path_1.default.join(__dirname, "../data/infiniteMute.json");
function loadInfiniteMuteList() {
    if (fs_1.default.existsSync(infiniteMuteFilePath)) {
        const data = fs_1.default.readFileSync(infiniteMuteFilePath, "utf8");
        return JSON.parse(data);
    }
    return [];
}
function setupInfiniteMuteWatcher(client) {
    // Observa mudanças de estado de voz
    client.on("voiceStateUpdate", async (oldState, newState) => {
        const infiniteMuteList = loadInfiniteMuteList();
        const member = newState.member;
        if (!member)
            return;
        if (infiniteMuteList.includes(member.id)) {
            if (!newState.mute) {
                await newState.setMute(true, "Infinite mute");
            }
        }
    });
    // Observa tentativas de enviar mensagens em texto
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const infiniteMuteList = loadInfiniteMuteList();
        if (infiniteMuteList.includes(newMember.id)) {
            const guild = newMember.guild;
            for (const channel of guild.channels.cache.values()) {
                if ((channel.type === 0 || channel.type === 5) && 'permissionOverwrites' in channel) {
                    await channel.permissionOverwrites.edit(newMember.id, { SendMessages: false });
                }
            }
        }
    });
}
