import {
    ChannelType,
    GuildMember,
    OverwriteResolvable,
    TextChannel,
    ButtonInteraction,
} from 'discord.js';
import { NukeEmbedBuilder } from './NukeEmbedBuilder';
import { NUKE_MESSAGES, NUKE_CUSTOM_IDS } from './constants';
import { channelConfig } from '../../config/ChannelConfigService';
import { PERMISSION_GROUPS, hasAnyRole } from '../../config/roles';
import { verificationService } from '../verification';

interface NukeContext {
    executorId: string;
    executorUsername: string;
    hasBanPermission: boolean;
}

const pendingNukes = new Map<string, {
    channelId: string;
    executorId: string;
    timestamp: number;
}>();

export class NukeService {
    getContext(member: GuildMember): NukeContext {
        return {
            executorId: member.id,
            executorUsername: member.user.username,
            hasBanPermission: hasAnyRole(member.roles.cache, PERMISSION_GROUPS.BAN_PERMISSION),
        };
    }

    async requestNuke(
        channel: TextChannel,
        context: NukeContext
    ): Promise<{ success: boolean; message: string }> {
        if (!context.hasBanPermission) {
            return { success: false, message: NUKE_MESSAGES.ERROR_NO_PERMISSION };
        }

        const isConfigured = channelConfig.isConfiguredChannel(channel.id);
        const purpose = channelConfig.getChannelPurpose(channel.id);

        const embed = NukeEmbedBuilder.buildConfirmEmbed(channel.name, isConfigured, purpose || undefined);
        const buttons = NukeEmbedBuilder.buildConfirmButtons();

        const reply = await channel.send({
            embeds: [embed],
            components: [buttons],
        });

        pendingNukes.set(reply.id, {
            channelId: channel.id,
            executorId: context.executorId,
            timestamp: Date.now(),
        });

        this.scheduleAutoDelete(reply.id, reply);

        return { success: true, message: '' };
    }

    async handleNukeButton(interaction: ButtonInteraction): Promise<void> {
        const pendingNuke = pendingNukes.get(interaction.message.id);

        if (!pendingNuke) {
            await interaction.reply({
                content: '❌ Esta confirmação expirou.',
                flags: 64,
            });
            return;
        }

        if (pendingNuke.executorId !== interaction.user.id) {
            await interaction.reply({
                content: '❌ Apenas quem solicitou pode confirmar ou cancelar.',
                flags: 64,
            });
            return;
        }

        pendingNukes.delete(interaction.message.id);

        if (interaction.customId === NUKE_CUSTOM_IDS.CANCEL) {
            await this.handleCancel(interaction);
            return;
        }

        if (interaction.customId === NUKE_CUSTOM_IDS.CONFIRM) {
            await this.executeNuke(interaction);
        }
    }

    private async handleCancel(interaction: ButtonInteraction): Promise<void> {
        await interaction.update({
            content: NUKE_MESSAGES.CANCELLED,
            embeds: [],
            components: [],
        });

        setTimeout(async () => {
            try {
                await interaction.message.delete();
            } catch {}
        }, 3000);
    }

    private async executeNuke(interaction: ButtonInteraction): Promise<void> {
        const oldChannel = interaction.channel as TextChannel;
        const guild = interaction.guild;

        if (!guild || !oldChannel) {
            await interaction.reply({
                content: NUKE_MESSAGES.ERROR_NUKE_FAILED,
                flags: 64,
            });
            return;
        }

        try {
            const channelProps = this.extractChannelProperties(oldChannel);
            const oldChannelId = oldChannel.id;
            const wasVerificationChannel = oldChannelId === channelConfig.verification.verificationChannelId;

            await oldChannel.delete();

            const newChannel = await guild.channels.create({
                name: channelProps.name,
                type: ChannelType.GuildText,
                topic: channelProps.topic || undefined,
                position: channelProps.position,
                parent: channelProps.parentId,
                nsfw: channelProps.nsfw,
                rateLimitPerUser: channelProps.rateLimitPerUser,
                permissionOverwrites: channelProps.permissionOverwrites,
            });

            if (channelConfig.isConfiguredChannel(oldChannelId)) {
                channelConfig.updateChannelId(oldChannelId, newChannel.id);
            }

            await newChannel.send(NUKE_MESSAGES.SUCCESS(interaction.user.id));

            if (wasVerificationChannel) {
                await verificationService.sendVerificationEmbed(newChannel);
            }
        } catch {}
    }

    private extractChannelProperties(channel: TextChannel) {
        const permissionOverwrites: OverwriteResolvable[] = [];
        channel.permissionOverwrites.cache.forEach((overwrite) => {
            permissionOverwrites.push({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow,
                deny: overwrite.deny,
            });
        });

        return {
            name: channel.name,
            topic: channel.topic,
            position: channel.position,
            parentId: channel.parent?.id,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.rateLimitPerUser,
            permissionOverwrites,
        };
    }

    private scheduleAutoDelete(messageId: string, message: import('discord.js').Message): void {
        setTimeout(async () => {
            if (pendingNukes.has(messageId)) {
                pendingNukes.delete(messageId);
                try {
                    await message.delete();
                } catch {}
            }
        }, 30000);
    }
}

export const nukeService = new NukeService();
