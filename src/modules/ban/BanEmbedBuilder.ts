import { EmbedBuilder } from 'discord.js';
import { BanLogData, BanAction, BlacklistEntry } from './types';
import { BAN_MESSAGES } from './constants';

export class BanEmbedBuilder {
    private static readonly COLORS = {
        ban: '#FF0000',
        unban: '#00FF00',
        blacklist_add: '#8B0000',
        blacklist_remove: '#00FF00',
        unbanall: '#00FF00',
    } as const;

    private static readonly TITLES = {
        ban: BAN_MESSAGES.LOG_TITLE_BAN,
        unban: BAN_MESSAGES.LOG_TITLE_UNBAN,
        blacklist_add: BAN_MESSAGES.LOG_TITLE_BLACKLIST_ADD,
        blacklist_remove: BAN_MESSAGES.LOG_TITLE_BLACKLIST_REMOVE,
        unbanall: BAN_MESSAGES.LOG_TITLE_UNBANALL,
    } as const;

    static buildLogEmbed(data: BanLogData, guildIconUrl?: string): EmbedBuilder {
        const color = this.COLORS[data.action];
        const title = this.TITLES[data.action];

        const embed = new EmbedBuilder()
            .setColor(color as `#${string}`)
            .setTitle(title)
            .setThumbnail(data.odAvatar || null)
            .addFields(
                {
                    name: '👤 Usuário',
                    value: `<@${data.odId}>\n\`${data.odId}\``,
                    inline: true,
                },
                {
                    name: '👮 Moderador',
                    value: `<@${data.moderatorId}>\n\`${data.moderatorId}\``,
                    inline: true,
                },
                {
                    name: '📝 Motivo',
                    value: data.reason || 'Não especificado',
                    inline: false,
                },
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Moderação', iconURL: guildIconUrl });

        return embed;
    }

    static buildUnbanAllEmbed(
        count: number,
        moderatorId: string,
        moderatorUsername: string,
        guildIconUrl?: string
    ): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(BAN_MESSAGES.LOG_TITLE_UNBANALL)
            .addFields(
                {
                    name: '📊 Quantidade',
                    value: `${count} usuário(s) desbanidos`,
                    inline: true,
                },
                {
                    name: '👮 Moderador',
                    value: `<@${moderatorId}>\n\`${moderatorId}\``,
                    inline: true,
                },
                {
                    name: '⚠️ Observação',
                    value: 'Usuários na blacklist não foram desbanidos.',
                    inline: false,
                },
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Moderação', iconURL: guildIconUrl });
    }

    static buildAutobanEmbed(
        entry: BlacklistEntry,
        guildIconUrl?: string
    ): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle(BAN_MESSAGES.LOG_TITLE_AUTO_BAN)
            .addFields(
                {
                    name: '👤 Usuário',
                    value: `<@${entry.odId}>\n\`${entry.odId}\``,
                    inline: true,
                },
                {
                    name: '📝 Motivo Original',
                    value: entry.reason || 'Não especificado',
                    inline: true,
                },
                {
                    name: '⚠️ Observação',
                    value: 'Usuário estava na blacklist e tentou entrar no servidor.',
                    inline: false,
                },
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Moderação', iconURL: guildIconUrl });
    }

    static buildBlacklistEmbed(entries: BlacklistEntry[]): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('📋 Blacklist do Servidor')
            .setTimestamp();

        if (entries.length === 0) {
            embed.setDescription('A blacklist está vazia.');
            return embed;
        }

        const description = entries
            .slice(0, 25)
            .map((entry, index) => {
                const date = new Date(entry.bannedAt).toLocaleDateString('pt-BR');
                return `**${index + 1}.** <@${entry.odId}> (\`${entry.odId}\`)\n   📝 ${entry.reason || 'Sem motivo'}\n   📅 ${date}`;
            })
            .join('\n\n');

        embed.setDescription(description);

        if (entries.length > 25) {
            embed.setFooter({ text: `Mostrando 25 de ${entries.length} entradas` });
        } else {
            embed.setFooter({ text: `Total: ${entries.length} entrada(s)` });
        }

        return embed;
    }

    static buildPanelEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('⛔ Painel de Blacklist')
            .setDescription(
                'Selecione uma opção abaixo para gerenciar a blacklist:\n\n' +
                '**➕ Adicionar** - Adiciona um usuário à blacklist\n' +
                '**➖ Remover** - Remove um usuário da blacklist\n' +
                '**📋 Listar** - Lista todos os usuários na blacklist'
            )
            .setTimestamp();
    }
}

