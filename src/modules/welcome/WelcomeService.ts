import { AuditLogEvent, Client, Guild, GuildMember, PartialGuildMember } from 'discord.js';
import { WelcomeEmbedBuilder, LogData } from './WelcomeEmbedBuilder';
import { LeaveType } from './constants';
import { extractMemberInfo } from './types';
import { channelConfig } from '../../config/ChannelConfigService';
import { ChannelUtils } from '../../shared/utils';

export class WelcomeService {
    async sendWelcomeMessage(member: GuildMember): Promise<boolean> {
        const channel = await ChannelUtils.getTextChannel(member.client, channelConfig.welcome.welcomeChannelId);
        if (!channel) return false;

        const memberInfo = extractMemberInfo(member);
        const serverName = member.guild.name;

        const embed = WelcomeEmbedBuilder.buildWelcomeEmbed({
            member: memberInfo,
            serverName,
        });

        try {
            await channel.send({ embeds: [embed] });
            return true;
        } catch {
            return false;
        }
    }

    async sendGoodbyeMessage(
        member: GuildMember | PartialGuildMember,
        client: Client,
        guildName: string,
        leaveType: LeaveType = 'leave'
    ): Promise<boolean> {
        const channel = await ChannelUtils.getTextChannel(client, channelConfig.welcome.goodbyeChannelId);
        if (!channel) return false;

        const memberInfo = extractMemberInfo(member);

        const embed = WelcomeEmbedBuilder.buildGoodbyeEmbed(
            { member: memberInfo, serverName: guildName },
            leaveType
        );

        try {
            await channel.send({
                content: `<@${memberInfo.id}>`,
                embeds: [embed],
            });
            return true;
        } catch {
            return false;
        }
    }

    async detectLeaveType(guild: Guild, userId: string): Promise<LeaveType> {
        try {
            const banLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1,
            });
            const banEntry = banLogs.entries.first();
            if (banEntry && banEntry.target?.id === userId && Date.now() - banEntry.createdTimestamp < 5000) {
                return 'ban';
            }

            const kickLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 1,
            });
            const kickEntry = kickLogs.entries.first();
            if (kickEntry && kickEntry.target?.id === userId && Date.now() - kickEntry.createdTimestamp < 5000) {
                return 'kick';
            }

            return 'leave';
        } catch {
            return 'leave';
        }
    }

    async sendLogMessage(
        member: GuildMember | PartialGuildMember,
        client: Client,
        guildName: string
    ): Promise<boolean> {
        const channel = await ChannelUtils.getTextChannel(client, channelConfig.welcome.logChannelId);
        if (!channel) return false;

        const memberInfo = extractMemberInfo(member);

        const roles = member.roles?.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name) || [];

        const logData: LogData = {
            member: memberInfo,
            serverName: guildName,
            joinedAt: member.joinedAt,
            roles,
        };

        const embed = WelcomeEmbedBuilder.buildLogEmbed(logData);

        try {
            await channel.send({ embeds: [embed] });
            return true;
        } catch {
            return false;
        }
    }
}

export const welcomeService = new WelcomeService();
