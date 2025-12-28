import {
    Client,
    Guild,
    GuildMember,
    TextChannel,
    ButtonInteraction,
    StringSelectMenuInteraction,
} from 'discord.js';
import { VerificationEmbedBuilder } from './VerificationEmbedBuilder';
import { VerificationButtonBuilder, VerifierOption } from './VerificationButtonBuilder';
import { verificationRepository } from './VerificationRepository';
import { VERIFICATION_CONFIG, VERIFICATION_MESSAGES, ROLE_IDS } from './constants';
import { VerificationRequest, VerificationRequestData, extractUserInfo, extractMemberInfo } from './types';
import { channelConfig } from '../../config/ChannelConfigService';
import { ChannelUtils } from '../../shared/utils';

export class VerificationService {
    async sendVerificationEmbed(channel: TextChannel): Promise<boolean> {
        try {
            const embed = VerificationEmbedBuilder.buildVerificationEmbed();
            const button = VerificationButtonBuilder.buildVerifyButton();

            await channel.send({
                embeds: [embed],
                components: [button],
            });

            return true;
        } catch {
            return false;
        }
    }

    async initVerificationEmbed(client: Client): Promise<void> {
        try {
            const verificationChannelId = channelConfig.verification.verificationChannelId;
            if (!verificationChannelId) return;

            const channel = await ChannelUtils.getTextChannel(client, verificationChannelId);
            if (!channel) return;

            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessage = messages.find(
                msg => msg.author.id === client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.components.length > 0
            );

            if (botMessage) return;

            await this.sendVerificationEmbed(channel);
        } catch {}
    }

    async handleVerifyButton(interaction: ButtonInteraction): Promise<void> {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: '❌ Erro ao processar verificação.',
                ephemeral: true,
            });
            return;
        }

        const cooldownRemaining = verificationRepository.getCooldownRemaining(interaction.user.id);
        if (cooldownRemaining > 0) {
            const minutes = Math.ceil(cooldownRemaining / 60000);
            await interaction.reply({
                content: `❌ Aguarde **${minutes} minuto(s)** antes de solicitar novamente.`,
                ephemeral: true,
            });
            return;
        }

        const existingRequest = verificationRepository.getPendingByRequester(interaction.user.id);
        if (existingRequest) {
            await interaction.reply({
                content: '❌ Você já possui uma solicitação de verificação pendente.',
                ephemeral: true,
            });
            return;
        }

        const verifiers = await this.fetchVerifiers(guild);

        if (verifiers.length === 0) {
            await interaction.reply({
                content: '❌ Nenhum verificador disponível no momento.',
                ephemeral: true,
            });
            return;
        }

        const selectMenu = VerificationButtonBuilder.buildVerifierSelect(verifiers);

        await interaction.reply({
            content: `**${VERIFICATION_MESSAGES.QUESTION}**`,
            components: [selectMenu],
            ephemeral: true,
        });
    }

    async handleVerifierSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const verifierId = interaction.values[0];
        const guild = interaction.guild;

        if (!guild) {
            await interaction.reply({
                content: '❌ Erro ao processar verificação.',
                ephemeral: true,
            });
            return;
        }

        let verifier: GuildMember;
        try {
            verifier = await guild.members.fetch(verifierId);
        } catch {
            await interaction.reply({
                content: '❌ Verificador não encontrado.',
                ephemeral: true,
            });
            return;
        }

        const requestId = verificationRepository.generateId();
        const requesterInfo = extractUserInfo(interaction.user);
        const verifierInfo = extractMemberInfo(verifier);

        const request: VerificationRequest = {
            id: requestId,
            requesterId: requesterInfo.id,
            requesterUsername: requesterInfo.username,
            requesterAvatarUrl: requesterInfo.avatarUrl,
            verifierId: verifierInfo.id,
            verifierUsername: verifierInfo.username,
            question: VERIFICATION_MESSAGES.QUESTION,
            answer: verifierInfo.displayName,
            status: 'pending',
            createdAt: new Date(),
        };

        verificationRepository.create(request);

        const approvalChannel = await ChannelUtils.getTextChannel(interaction.client, channelConfig.verification.approvalChannelId);
        if (!approvalChannel) {
            await interaction.reply({
                content: '❌ Canal de aprovação não encontrado.',
                ephemeral: true,
            });
            return;
        }

        const requestData: VerificationRequestData = {
            requester: requesterInfo,
            verifier: verifierInfo,
            answer: verifierInfo.displayName,
        };

        const guildIconUrl = guild.iconURL({ extension: 'png', size: 128 }) || undefined;
        const approvalEmbed = VerificationEmbedBuilder.buildApprovalEmbed(requestData, requestId, guildIconUrl);
        const approvalButtons = VerificationButtonBuilder.buildApprovalButtons(requestId);

        const approvalMessage = await approvalChannel.send({
            content: `<@${verifierId}>`,
            embeds: [approvalEmbed],
            components: [approvalButtons],
        });

        verificationRepository.linkMessageToRequest(approvalMessage.id, requestId);

        await interaction.update({
            content: `✅ Sua solicitação foi enviada para <@${verifierId}>. Aguarde a aprovação.`,
            components: [],
        });
    }

    async handleApproval(interaction: ButtonInteraction, requestId: string, approved: boolean): Promise<void> {
        const request = verificationRepository.getById(requestId);

        if (!request) {
            await interaction.reply({
                content: '❌ Solicitação não encontrada.',
                ephemeral: true,
            });
            return;
        }

        if (request.status !== 'pending') {
            await interaction.reply({
                content: '❌ Esta solicitação já foi processada.',
                ephemeral: true,
            });
            return;
        }

        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: '❌ Erro ao processar.',
                ephemeral: true,
            });
            return;
        }

        const resolverInfo = extractUserInfo(interaction.user);
        const status = approved ? 'approved' : 'rejected';

        verificationRepository.updateStatus(requestId, status, resolverInfo.id, resolverInfo.username);

        if (approved) {
            await this.updateMemberRoles(guild, request.requesterId);
        }

        try {
            const requester = await interaction.client.users.fetch(request.requesterId);
            if (approved) {
                await requester.send({
                    content: `✅ **Sua verificação foi aprovada!**\n\nVocê agora tem acesso completo ao servidor **AUGE**.`,
                });
            } else {
                await requester.send({
                    content: `❌ **Sua verificação foi rejeitada.**\n\nVocê pode tentar novamente clicando em "Verificar" no canal de verificação.`,
                });
            }
        } catch {}

        const logChannel = await ChannelUtils.getTextChannel(interaction.client, channelConfig.verification.logChannelId);
        if (logChannel) {
            const requesterInfo = {
                id: request.requesterId,
                username: request.requesterUsername,
                displayName: request.requesterUsername,
                avatarUrl: request.requesterAvatarUrl,
            };

            const verifierInfo = {
                id: request.verifierId,
                username: request.verifierUsername,
                displayName: request.verifierUsername,
                avatarUrl: '',
            };

            const requestData: VerificationRequestData = {
                requester: requesterInfo,
                verifier: verifierInfo,
                answer: request.answer,
            };

            const guildIconUrl = guild.iconURL({ extension: 'png', size: 128 }) || undefined;
            const logEmbed = VerificationEmbedBuilder.buildLogEmbed(requestData, status, resolverInfo, guildIconUrl);
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.message.delete().catch(() => { });
        await interaction.deferUpdate().catch(() => { });
    }

    private async updateMemberRoles(guild: Guild, memberId: string): Promise<void> {
        try {
            const member = await guild.members.fetch(memberId);

            if (member.roles.cache.has(ROLE_IDS.UNVERIFIED)) {
                await member.roles.remove(ROLE_IDS.UNVERIFIED);
            }

            await member.roles.add(ROLE_IDS.VERIFIED);
        } catch {}
    }

    private async fetchVerifiers(guild: Guild): Promise<VerifierOption[]> {
        const verifiers: VerifierOption[] = [];
        const seenIds = new Set<string>();

        await guild.members.fetch();

        for (const roleId of VERIFICATION_CONFIG.verifierRoleIds) {
            try {
                const role = await guild.roles.fetch(roleId);
                if (!role) continue;

                for (const [memberId, member] of role.members) {
                    if (seenIds.has(memberId)) continue;
                    seenIds.add(memberId);

                    verifiers.push({
                        id: memberId,
                        username: member.user.username,
                        displayName: member.displayName || member.user.username,
                    });
                }
            } catch {}
        }

        return verifiers;
    }
}

export const verificationService = new VerificationService();
