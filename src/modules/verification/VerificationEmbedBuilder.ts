import { EmbedBuilder } from 'discord.js';
import { VerificationRequestData, UserInfo } from './types';
import { VERIFICATION_CONFIG, VERIFICATION_MESSAGES, VERIFICATION_IMAGE } from './constants';

export class VerificationEmbedBuilder {
    static buildVerificationEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(VERIFICATION_CONFIG.embedColor as `#${string}`)
            .setTitle(VERIFICATION_MESSAGES.EMBED_TITLE)
            .setDescription(this.buildVerificationDescription())
            .setImage(VERIFICATION_IMAGE)
            .setFooter({ text: VERIFICATION_MESSAGES.FOOTER });
    }

    private static buildVerificationDescription(): string {
        return [
            `**${VERIFICATION_MESSAGES.MEMBER_SECTION_TITLE}**`,
            `${VERIFICATION_MESSAGES.MEMBER_INSTRUCTION}`,
            '',
            `**${VERIFICATION_MESSAGES.FRIEND_SECTION_TITLE}**`,
            `${VERIFICATION_MESSAGES.FRIEND_INSTRUCTION}`,
            '',
            `**${VERIFICATION_MESSAGES.OWNERS_TITLE}** ${VERIFICATION_MESSAGES.OWNERS_LIST}`,
        ].join('\n');
    }

    static buildApprovalEmbed(data: VerificationRequestData, requestId: string, guildIconUrl?: string): EmbedBuilder {
        const { requester, verifier, answer } = data;

        return new EmbedBuilder()
            .setColor(VERIFICATION_CONFIG.embedColor as `#${string}`)
            .setAuthor({
                name: 'AUGE',
                iconURL: guildIconUrl || undefined,
            })
            .setThumbnail(requester.avatarUrl)
            .addFields(
                {
                    name: 'Usuário(a):',
                    value: `<@${requester.id}>  ${requester.id}`,
                    inline: false,
                },
                {
                    name: 'Informações:',
                    value: [
                        `**PERGUNTA PADRÃO:** ${VERIFICATION_MESSAGES.QUESTION}`,
                        `R: ${answer}`,
                    ].join('\n'),
                    inline: false,
                },
            )
            .setFooter({ text: this.formatTime() });
    }

    static buildLogEmbed(
        data: VerificationRequestData,
        status: 'approved' | 'rejected',
        resolvedBy: UserInfo,
        guildIconUrl?: string
    ): EmbedBuilder {
        const { requester } = data;
        const statusColor = status === 'approved' ? '#00FF00' : '#FF0000';
        const statusText = status === 'approved' ? 'Aceito' : 'Recusado';

        return new EmbedBuilder()
            .setColor(statusColor as `#${string}`)
            .setAuthor({
                name: 'AUGE',
                iconURL: guildIconUrl || undefined,
            })
            .setThumbnail(requester.avatarUrl)
            .addFields(
                {
                    name: 'Usuário(a):',
                    value: `<@${requester.id}>  ${requester.id}`,
                    inline: false,
                },
                {
                    name: 'Informações:',
                    value: `${statusText} por: <@${resolvedBy.id}>  ${resolvedBy.id}`,
                    inline: false,
                },
            )
            .setFooter({ text: this.formatTime() });
    }

    private static formatTime(): string {
        const now = new Date();
        return `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
}

