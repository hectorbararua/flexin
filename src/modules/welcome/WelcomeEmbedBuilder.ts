import { EmbedBuilder } from 'discord.js';
import { MemberInfo, WelcomeMessageData, GoodbyeMessageData } from './types';
import { WELCOME_CONFIG, GOODBYE_CONFIG, WELCOME_MESSAGES, GOODBYE_MESSAGES, LOG_MESSAGES, LeaveType } from './constants';
import { COLORS } from '../../config/emojis';
import { UserUtils } from '../../shared/utils';

export interface LogData {
    member: MemberInfo;
    serverName: string;
    joinedAt?: Date | null;
    roles?: string[];
}

export class WelcomeEmbedBuilder {
    static buildWelcomeEmbed(data: WelcomeMessageData): EmbedBuilder {
        const { member } = data;
        const mention = `<@${member.id}>`;

        return new EmbedBuilder()
            .setColor(WELCOME_CONFIG.color as `#${string}`)
            .setTitle(WELCOME_MESSAGES.TITLE)
            .setDescription(WELCOME_MESSAGES.DESCRIPTION(mention))
            .setImage(WELCOME_CONFIG.gifUrl)
            .setTimestamp();
    }

    static buildGoodbyeEmbed(data: GoodbyeMessageData, leaveType: LeaveType = 'leave'): EmbedBuilder {
        const { member } = data;
        const config = GOODBYE_MESSAGES[leaveType.toUpperCase() as keyof typeof GOODBYE_MESSAGES] as {
            TITLE: string;
            DESCRIPTION: (username: string) => string;
        };

        return new EmbedBuilder()
            .setColor(GOODBYE_CONFIG.color as `#${string}`)
            .setTitle(config.TITLE)
            .setDescription(config.DESCRIPTION(member.username))
            .setThumbnail(member.avatarUrl)
            .setImage(GOODBYE_CONFIG.gifUrl)
            .setFooter({ text: GOODBYE_MESSAGES.FOOTER(member.id) });
    }

    static buildLogEmbed(data: LogData): EmbedBuilder {
        const { member, joinedAt, roles } = data;

        const timeInServer = joinedAt 
            ? UserUtils.formatTimeDiff(joinedAt)
            : 'Desconhecido';

        const accountAge = UserUtils.formatDate(member.createdAt);
        const joinedDate = joinedAt ? UserUtils.formatDate(joinedAt) : 'Desconhecido';
        const leftDate = UserUtils.formatDate(new Date());

        const rolesText = roles && roles.length > 0
            ? roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` (+${roles.length - 10} mais)` : '')
            : 'Nenhum cargo';

        return new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(LOG_MESSAGES.TITLE)
            .setThumbnail(member.avatarUrl)
            .addFields(
                { name: '👤 Usuário', value: `${member.username}`, inline: true },
                { name: '🆔 ID', value: member.id, inline: true },
                { name: '📛 Menção', value: `<@${member.id}>`, inline: true },
                { name: '📅 Conta criada', value: accountAge, inline: true },
                { name: '📥 Entrou em', value: joinedDate, inline: true },
                { name: '📤 Saiu em', value: leftDate, inline: true },
                { name: '⏱️ Tempo no servidor', value: timeInServer, inline: true },
                { name: '🎭 Cargos', value: rolesText, inline: false },
            )
            .setTimestamp();
    }
}
