import { ButtonInteractionType, TutorialPlatform, PLATFORM_CONFIG } from '../types';
import { PainelEmbedBuilder, ComponentBuilder, PainelModalBuilder } from '../builders';
import { TUTORIALS } from '../constants';
import { getClientService } from '../../../lib/selfbot';

const ROLE_CONFIG = {
    GUILD_ID: '1453013291734401249',
    VERIFIED_ROLE_ID: '1453031454257713192',
    UNVERIFIED_ROLE_ID: '1453031495466876990'
} as const;

async function handleTutorial(
    interaction: ButtonInteractionType, 
    platform: TutorialPlatform
): Promise<void> {
    const embed = PainelEmbedBuilder.buildTutorialEmbed(platform);
    const config = PLATFORM_CONFIG[platform];
    
    const replyOptions: Parameters<typeof interaction.reply>[0] = {
        content: `\`\`\`\n${TUTORIALS[platform].CODE}\n\`\`\``,
        embeds: [embed],
        ephemeral: true
    };

    if (config.showDiscordButton) {
        replyOptions.components = [ComponentBuilder.buildDiscordLinkButton()];
    }

    await interaction.reply(replyOptions);
}

export class ButtonHandlers {
    static async handleTutorialIphone(interaction: ButtonInteractionType): Promise<void> {
        await handleTutorial(interaction, 'IPHONE');
    }

    static async handleTutorialPC(interaction: ButtonInteractionType): Promise<void> {
        await handleTutorial(interaction, 'PC');
    }

    static async handleTutorialAndroid(interaction: ButtonInteractionType): Promise<void> {
        await handleTutorial(interaction, 'ANDROID');
    }

    static async handleToken(interaction: ButtonInteractionType): Promise<void> {
        const modal = PainelModalBuilder.buildTokenModal();
        await interaction.showModal(modal);
    }

    static async handleStatus(interaction: ButtonInteractionType): Promise<void> {
        const { id: userId, username } = interaction.user;
        const clientService = getClientService();
        
        const hasToken = clientService.hasToken(userId);
        
        if (!hasToken) {
            await this.handleNoToken(interaction, userId);
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const client = await clientService.ensureClient(userId, username);
        
        if (!client) {
            await this.handleInvalidToken(interaction, userId);
            return;
        }

        const isOnline = client.isReady();
        const tag = client.tag || 'Desconhecido';
        const isInCall = client.voiceService.hasTarget();
        const channelId = client.voiceService.getTargetChannelId();

        if (isOnline) {
            await this.updateVerifiedRole(interaction, userId, true);
        }

        const callText = isInCall ? `Em call (<#${channelId}>)` : 'Não está em call';
        const roleStatus = isOnline ? '\n\n✅ Cargo atualizado!' : '';

        await interaction.editReply({
            content: `📊 **Verificar Status**\n\n` +
                `🔑 **Token:** ✅ Válida\n\n` +
                `**Conta:**\n` +
                `👤 ${tag}\n` +
                `${isInCall ? '📞' : '📴'} ${callText}${roleStatus}`
        });
    }

    private static async handleNoToken(interaction: ButtonInteractionType, userId: string): Promise<void> {
        await this.updateVerifiedRole(interaction, userId, false);
        
        await interaction.reply({
            content: `📊 **Verificar Status**\n\n` +
                `🔑 **Token:** ❌ Não cadastrada\n\n` +
                `**Conta:**\n` +
                `👤 Nenhuma conta vinculada\n\n` +
                `Use o botão **Conectar Token** para vincular.`,
            ephemeral: true
        });
    }

    private static async handleInvalidToken(interaction: ButtonInteractionType, userId: string): Promise<void> {
        await this.updateVerifiedRole(interaction, userId, false);
        
        await interaction.editReply({
            content: `📊 **Verificar Status**\n\n` +
                `🔑 **Token:** ❌ Inválida ou expirada\n\n` +
                `**Conta:**\n` +
                `👤 Não foi possível conectar\n\n` +
                `Conecte novamente usando o botão **Conectar Token**.`
        });
    }

    private static async updateVerifiedRole(
        interaction: ButtonInteractionType, 
        userId: string, 
        isVerified: boolean
    ): Promise<void> {
        try {
            const guild = await interaction.client.guilds.fetch(ROLE_CONFIG.GUILD_ID);
            const member = await guild.members.fetch(userId);
            
            if (isVerified) {
                if (!member.roles.cache.has(ROLE_CONFIG.VERIFIED_ROLE_ID)) {
                    await member.roles.add(ROLE_CONFIG.VERIFIED_ROLE_ID);
                }
                if (member.roles.cache.has(ROLE_CONFIG.UNVERIFIED_ROLE_ID)) {
                    await member.roles.remove(ROLE_CONFIG.UNVERIFIED_ROLE_ID);
                }
            } else {
                if (member.roles.cache.has(ROLE_CONFIG.VERIFIED_ROLE_ID)) {
                    await member.roles.remove(ROLE_CONFIG.VERIFIED_ROLE_ID);
                }
                if (!member.roles.cache.has(ROLE_CONFIG.UNVERIFIED_ROLE_ID)) {
                    await member.roles.add(ROLE_CONFIG.UNVERIFIED_ROLE_ID);
                }
            }
        } catch {}
    }
}
