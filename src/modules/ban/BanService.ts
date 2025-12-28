import {
    Client,
    Guild,
    GuildMember,
    TextChannel,
    User,
    ButtonInteraction,
    ModalSubmitInteraction,
} from 'discord.js';
import { BanEmbedBuilder } from './BanEmbedBuilder';
import { BanButtonBuilder } from './BanButtonBuilder';
import { banRepository } from './BanRepository';
import { BAN_CONFIG, BAN_MESSAGES, BAN_CUSTOM_IDS } from './constants';
import { BlacklistEntry, BanLogData, CommandContext } from './types';
import { channelConfig } from '../../config/ChannelConfigService';
import { ChannelUtils } from '../../shared/utils';
import { isOwner } from '../../config/owners';
import { hasAnyRole } from '../../config/roles';

export class BanService {
    async banUser(
        guild: Guild,
        targetId: string,
        reason: string,
        context: CommandContext
    ): Promise<{ success: boolean; message: string }> {
        if (targetId === context.authorId) {
            return { success: false, message: BAN_MESSAGES.ERROR_CANNOT_BAN_SELF };
        }

        if (targetId === guild.client.user?.id) {
            return { success: false, message: BAN_MESSAGES.ERROR_CANNOT_BAN_BOT };
        }

        try {
            const user = await this.fetchUser(guild.client, targetId);
            await guild.members.ban(targetId, { reason });

            await this.sendLog(guild, {
                odId: targetId,
                odUsername: user?.username || 'Desconhecido',
                odAvatar: user?.displayAvatarURL({ extension: 'png', size: 128 }),
                reason,
                moderatorId: context.authorId,
                moderatorUsername: context.authorUsername,
                action: 'ban',
            });

            return { success: true, message: BAN_MESSAGES.BAN_SUCCESS(targetId) };
        } catch {
            return { success: false, message: BAN_MESSAGES.ERROR_BAN_FAILED };
        }
    }

    async unbanUser(
        guild: Guild,
        targetId: string,
        context: CommandContext
    ): Promise<{ success: boolean; message: string }> {
        if (banRepository.isBlacklisted(targetId)) {
            return { success: false, message: BAN_MESSAGES.ERROR_USER_IN_BLACKLIST };
        }

        try {
            const bans = await guild.bans.fetch();
            const ban = bans.get(targetId);

            if (!ban) {
                return { success: false, message: BAN_MESSAGES.ERROR_NOT_BANNED };
            }

            await guild.members.unban(targetId);

            await this.sendLog(guild, {
                odId: targetId,
                odUsername: ban.user.username,
                odAvatar: ban.user.displayAvatarURL({ extension: 'png', size: 128 }),
                reason: 'Desbanido manualmente',
                moderatorId: context.authorId,
                moderatorUsername: context.authorUsername,
                action: 'unban',
            });

            return { success: true, message: BAN_MESSAGES.UNBAN_SUCCESS(targetId) };
        } catch {
            return { success: false, message: BAN_MESSAGES.ERROR_UNBAN_FAILED };
        }
    }

    async unbanAll(
        guild: Guild,
        context: CommandContext
    ): Promise<{ success: boolean; message: string }> {
        if (!context.hasUnbanAllRole) {
            return { success: false, message: BAN_MESSAGES.ERROR_NO_PERMISSION };
        }

        try {
            const bans = await guild.bans.fetch();
            let unbannedCount = 0;

            for (const [userId] of bans) {
                if (banRepository.isBlacklisted(userId)) continue;

                try {
                    await guild.members.unban(userId);
                    unbannedCount++;
                } catch {}
            }

            const logChannel = await ChannelUtils.getTextChannel(guild.client, channelConfig.ban.logChannelId);
            if (logChannel) {
                const embed = BanEmbedBuilder.buildUnbanAllEmbed(
                    unbannedCount,
                    context.authorId,
                    context.authorUsername,
                    guild.iconURL({ extension: 'png', size: 128 }) || undefined
                );
                await logChannel.send({ embeds: [embed] });
            }

            return { success: true, message: BAN_MESSAGES.UNBANALL_SUCCESS(unbannedCount) };
        } catch {
            return { success: false, message: BAN_MESSAGES.ERROR_UNBAN_FAILED };
        }
    }

    async addToBlacklist(
        guild: Guild,
        targetId: string,
        reason: string,
        context: CommandContext
    ): Promise<{ success: boolean; message: string }> {
        if (!context.isOwner) {
            return { success: false, message: BAN_MESSAGES.ERROR_ONLY_OWNERS };
        }

        if (targetId === context.authorId) {
            return { success: false, message: BAN_MESSAGES.ERROR_CANNOT_BAN_SELF };
        }

        if (targetId === guild.client.user?.id) {
            return { success: false, message: BAN_MESSAGES.ERROR_CANNOT_BAN_BOT };
        }

        try {
            const user = await this.fetchUser(guild.client, targetId);

            const entry: BlacklistEntry = {
                odId: targetId,
                odUsername: user?.username || 'Desconhecido',
                odAvatar: user?.displayAvatarURL({ extension: 'png', size: 128 }),
                reason,
                bannedBy: context.authorId,
                bannedByUsername: context.authorUsername,
                bannedAt: new Date(),
            };
            banRepository.addToBlacklist(entry);

            try {
                await guild.members.ban(targetId, { reason: `[BLACKLIST] ${reason}` });
            } catch {}

            await this.sendLog(guild, {
                odId: targetId,
                odUsername: user?.username || 'Desconhecido',
                odAvatar: user?.displayAvatarURL({ extension: 'png', size: 128 }),
                reason,
                moderatorId: context.authorId,
                moderatorUsername: context.authorUsername,
                action: 'blacklist_add',
            });

            return { success: true, message: BAN_MESSAGES.BLACKLIST_ADD_SUCCESS(targetId) };
        } catch {
            return { success: false, message: BAN_MESSAGES.ERROR_BAN_FAILED };
        }
    }

    async removeFromBlacklist(
        guild: Guild,
        targetId: string,
        context: CommandContext
    ): Promise<{ success: boolean; message: string }> {
        if (!context.isOwner) {
            return { success: false, message: BAN_MESSAGES.ERROR_ONLY_OWNERS };
        }

        const entry = banRepository.getBlacklistEntry(targetId);
        if (!entry) {
            return { success: false, message: BAN_MESSAGES.ERROR_NOT_IN_BLACKLIST };
        }

        if (entry.bannedBy !== context.authorId) {
            return { success: false, message: BAN_MESSAGES.ERROR_NOT_BLACKLIST_OWNER };
        }

        banRepository.removeFromBlacklist(targetId);

        await this.sendLog(guild, {
            odId: targetId,
            odUsername: entry.odUsername,
            odAvatar: entry.odAvatar,
            reason: 'Removido da blacklist',
            moderatorId: context.authorId,
            moderatorUsername: context.authorUsername,
            action: 'blacklist_remove',
        });

        return { success: true, message: BAN_MESSAGES.BLACKLIST_REMOVE_SUCCESS(targetId) };
    }

    async sendBlacklistPanelInChannel(channel: TextChannel): Promise<void> {
        const embed = BanEmbedBuilder.buildPanelEmbed();
        const buttons = BanButtonBuilder.buildPanelButtons();

        await channel.send({
            embeds: [embed],
            components: [buttons],
        });
    }

    async handlePanelButton(interaction: ButtonInteraction): Promise<void> {
        const context = this.getContextFromInteraction(interaction);

        if (!context.isOwner) {
            await interaction.reply({
                content: BAN_MESSAGES.ERROR_ONLY_OWNERS,
                ephemeral: true,
            });
            return;
        }

        switch (interaction.customId) {
            case BAN_CUSTOM_IDS.BLACKLIST_ADD:
                await interaction.showModal(BanButtonBuilder.buildAddModal());
                break;

            case BAN_CUSTOM_IDS.BLACKLIST_REMOVE:
                await interaction.showModal(BanButtonBuilder.buildRemoveModal());
                break;

            case BAN_CUSTOM_IDS.BLACKLIST_LIST:
                await this.showBlacklistList(interaction);
                break;
        }
    }

    async handlePanelModal(interaction: ModalSubmitInteraction): Promise<void> {
        const guild = interaction.guild;
        if (!guild) return;

        const context = this.getContextFromInteraction(interaction);

        if (!context.isOwner) {
            await interaction.reply({
                content: BAN_MESSAGES.ERROR_ONLY_OWNERS,
                ephemeral: true,
            });
            return;
        }

        const userId = interaction.fields.getTextInputValue(BAN_CUSTOM_IDS.BLACKLIST_USER_INPUT);

        if (interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_ADD_MODAL) {
            const reason = interaction.fields.getTextInputValue(BAN_CUSTOM_IDS.BLACKLIST_REASON_INPUT);
            const result = await this.addToBlacklist(guild, userId, reason, context);
            await interaction.reply({ content: result.message, ephemeral: true });
        } else if (interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_REMOVE_MODAL) {
            const result = await this.removeFromBlacklist(guild, userId, context);
            await interaction.reply({ content: result.message, ephemeral: true });
        }
    }

    private async showBlacklistList(interaction: ButtonInteraction): Promise<void> {
        const entries = banRepository.getAllBlacklisted();
        const embed = BanEmbedBuilder.buildBlacklistEmbed(entries);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }

    async checkBlacklistOnJoin(member: GuildMember): Promise<boolean> {
        const entry = banRepository.getBlacklistEntry(member.id);
        if (!entry) return false;

        try {
            await member.ban({ reason: `[BLACKLIST AUTO-BAN] ${entry.reason}` });

            const logChannel = await ChannelUtils.getTextChannel(member.client, channelConfig.ban.blacklistLogChannelId);
            if (logChannel) {
                const embed = BanEmbedBuilder.buildAutobanEmbed(
                    entry,
                    member.guild.iconURL({ extension: 'png', size: 128 }) || undefined
                );
                await logChannel.send({ embeds: [embed] });
            }

            return true;
        } catch {
            return false;
        }
    }

    getContext(member: GuildMember): CommandContext {
        const hasBanRole = hasAnyRole(member.roles.cache, BAN_CONFIG.banRoleIds);

        return {
            authorId: member.id,
            authorUsername: member.user.username,
            isOwner: isOwner(member.id),
            hasUnbanAllRole: member.roles.cache.has(BAN_CONFIG.unbanAllRoleId),
            hasBanPermission: hasBanRole,
        };
    }

    private getContextFromInteraction(interaction: ButtonInteraction | ModalSubmitInteraction): CommandContext {
        const member = interaction.member as GuildMember;
        return this.getContext(member);
    }

    private async fetchUser(client: Client, userId: string): Promise<User | null> {
        try {
            return await client.users.fetch(userId);
        } catch {
            return null;
        }
    }

    private async sendLog(guild: Guild, data: BanLogData): Promise<void> {
        const isBlacklistAction = data.action === 'blacklist_add' || data.action === 'blacklist_remove';
        const channelId = isBlacklistAction
            ? channelConfig.ban.blacklistLogChannelId
            : channelConfig.ban.logChannelId;

        const logChannel = await ChannelUtils.getTextChannel(guild.client, channelId);
        if (!logChannel) return;

        const embed = BanEmbedBuilder.buildLogEmbed(
            data,
            guild.iconURL({ extension: 'png', size: 128 }) || undefined
        );
        await logChannel.send({ embeds: [embed] });
    }
}

export const banService = new BanService();
