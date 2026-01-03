import { 
    Guild, 
    EmbedBuilder, 
    AuditLogEvent, 
    User,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    ButtonInteraction
} from 'discord.js';

interface RoleChange {
    action: 'add' | 'remove';
    roleName: string;
    roleId: string;
    executorName: string;
    executorId: string;
    timestamp: Date;
    reason?: string;
}

interface RoleHistorySession {
    changes: RoleChange[];
    targetUser: User;
    requester: User;
    guild: Guild;
    currentPage: number;
    messageId: string;
}

const ITEMS_PER_PAGE = 5;

export class RoleHistoryService {
    private sessions: Map<string, RoleHistorySession> = new Map();

    async getRoleHistory(guild: Guild, targetUserId: string): Promise<RoleChange[]> {
        const changes: RoleChange[] = [];

        try {
            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 100,
            });

            for (const entry of auditLogs.entries.values()) {
                if (entry.target?.id !== targetUserId) continue;

                const executor = entry.executor;
                if (!executor) continue;

                for (const change of entry.changes) {
                    if (change.key === '$add' && Array.isArray(change.new)) {
                        for (const role of change.new) {
                            changes.push({
                                action: 'add',
                                roleName: role.name || 'Cargo Desconhecido',
                                roleId: role.id,
                                executorName: executor.username || 'Desconhecido',
                                executorId: executor.id,
                                timestamp: entry.createdAt,
                                reason: entry.reason || undefined,
                            });
                        }
                    }

                    if (change.key === '$remove' && Array.isArray(change.new)) {
                        for (const role of change.new) {
                            changes.push({
                                action: 'remove',
                                roleName: role.name || 'Cargo Desconhecido',
                                roleId: role.id,
                                executorName: executor.username || 'Desconhecido',
                                executorId: executor.id,
                                timestamp: entry.createdAt,
                                reason: entry.reason || undefined,
                            });
                        }
                    }
                }
            }
        } catch {}

        return changes;
    }

    private formatTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        }
        return 'agora';
    }

    buildEmbed(session: RoleHistorySession): EmbedBuilder {
        const { changes, targetUser, requester, guild, currentPage } = session;
        const totalPages = Math.ceil(changes.length / ITEMS_PER_PAGE) || 1;
        const startIdx = currentPage * ITEMS_PER_PAGE;
        const pageChanges = changes.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        const embed = new EmbedBuilder()
            .setTitle(`Histórico de Cargos | ${guild.name}`)
            .setColor('#FF2F92')
            .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
            .setFooter({ 
                text: `Página ${currentPage + 1}/${totalPages}`, 
                iconURL: guild.iconURL({ size: 128 }) || undefined 
            });

        let description = `Olá, <@${requester.id}>!\n`;
        description += `Visualizando histórico de <@${targetUser.id}>\n\n`;

        if (changes.length === 0) {
            description += '❌ Nenhum registro encontrado nos logs.';
        } else {
            for (const change of pageChanges) {
                const timeAgo = this.formatTimeAgo(change.timestamp);
                const actionLabel = change.action === 'add' ? 'Adicionado por:' : 'Removido por:';
                
                description += `**Cargo:** <@&${change.roleId}> ( ${change.roleName} )\n`;
                description += `**${actionLabel}** <@${change.executorId}> em ${timeAgo}\n`;
                description += `**Motivo:** ${change.reason || 'Sem motivo especificado'}\n\n`;
            }
        }

        embed.setDescription(description);

        return embed;
    }

    buildButtons(session: RoleHistorySession): ActionRowBuilder<ButtonBuilder> {
        const totalPages = Math.ceil(session.changes.length / ITEMS_PER_PAGE) || 1;
        const { currentPage } = session;

        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`rolehistory_prev_${session.messageId}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId(`rolehistory_page_${session.messageId}`)
                    .setLabel(`${currentPage + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`rolehistory_next_${session.messageId}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages - 1),
                new ButtonBuilder()
                    .setCustomId(`rolehistory_close_${session.messageId}`)
                    .setLabel('✕')
                    .setStyle(ButtonStyle.Danger),
            ],
        });
    }

    createSession(
        messageId: string,
        changes: RoleChange[],
        targetUser: User,
        requester: User,
        guild: Guild
    ): RoleHistorySession {
        const session: RoleHistorySession = {
            changes,
            targetUser,
            requester,
            guild,
            currentPage: 0,
            messageId,
        };
        this.sessions.set(messageId, session);
        return session;
    }

    getSession(messageId: string): RoleHistorySession | undefined {
        return this.sessions.get(messageId);
    }

    async handleButton(interaction: ButtonInteraction): Promise<void> {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const messageId = parts[2];

        const session = this.sessions.get(messageId);
        if (!session) {
            await interaction.reply({ content: '❌ Sessão expirada.', flags: 64 });
            return;
        }

        if (interaction.user.id !== session.requester.id) {
            await interaction.reply({ content: '❌ Apenas quem executou o comando pode navegar.', flags: 64 });
            return;
        }

        const totalPages = Math.ceil(session.changes.length / ITEMS_PER_PAGE) || 1;

        switch (action) {
            case 'prev':
                if (session.currentPage > 0) {
                    session.currentPage--;
                }
                break;
            case 'next':
                if (session.currentPage < totalPages - 1) {
                    session.currentPage++;
                }
                break;
            case 'close':
                this.sessions.delete(messageId);
                await interaction.message.delete().catch(() => {});
                return;
        }

        const embed = this.buildEmbed(session);
        const buttons = this.buildButtons(session);

        await interaction.update({
            embeds: [embed],
            components: [buttons.toJSON()],
        });
    }
}

export const roleHistoryService = new RoleHistoryService();
