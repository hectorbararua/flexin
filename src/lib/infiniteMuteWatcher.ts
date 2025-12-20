import { Client, VoiceState, TextChannel, NewsChannel } from "discord.js";
import fs from "fs";
import path from "path";

const infiniteMuteFilePath = path.join(__dirname, "../data/infiniteMute.json");

function loadInfiniteMuteList(): string[] {
    if (fs.existsSync(infiniteMuteFilePath)) {
        const data = fs.readFileSync(infiniteMuteFilePath, "utf8");
        return JSON.parse(data);
    }
    return [];
}

export function setupInfiniteMuteWatcher(client: Client) {
    client.on("voiceStateUpdate", async (_oldState: VoiceState, newState: VoiceState) => {
        const infiniteMuteList = loadInfiniteMuteList();
        const member = newState.member;
        if (!member) return;
        if (infiniteMuteList.includes(member.id)) {
            if (!newState.mute) {
                await newState.setMute(true, "Infinite mute");
            }
        }
    });

    client.on("guildMemberUpdate", async (_oldMember, newMember) => {
        const infiniteMuteList = loadInfiniteMuteList();
        if (infiniteMuteList.includes(newMember.id)) {
            const guild = newMember.guild;
            for (const channel of guild.channels.cache.values()) {
                if ((channel.type === 0 || channel.type === 5) && 'permissionOverwrites' in channel) {
                    await (channel as TextChannel | NewsChannel).permissionOverwrites.edit(newMember.id, { SendMessages: false });
                }
            }
        }
    });
}
