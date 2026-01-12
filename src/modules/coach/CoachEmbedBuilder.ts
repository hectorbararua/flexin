import { EmbedBuilder } from 'discord.js';
import {
    Coach,
    StudentRequest,
    GAME_STYLE_DISPLAY,
    TEACHING_STYLE_DISPLAY,
    PLATFORM_DISPLAY,
    AVAILABILITY_DISPLAY,
} from './types';
import { COACH_CONFIG, COACH_MESSAGES, COACH_IMAGE, COACH_TICKET_GIF, COACH_LEAVE_GIF } from './constants';
import { EMOJIS } from '../../config/emojis';

export class CoachEmbedBuilder {
    static buildRequestCoachEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(COACH_MESSAGES.EMBED_TITLE)
            .setDescription(COACH_MESSAGES.EMBED_DESCRIPTION)
            .setImage(COACH_IMAGE)
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildTicketWelcomeEmbed(username: string): EmbedBuilder {
        const description = [
            `${EMOJIS.SETINHA_ROXA} **Fala aí, ${username}! Bem-vindo ao sistema de treinamento da AUGE!**`,
            '',
            `${EMOJIS.PONTO_ROXO} Aqui a gente vai te conectar com um treinador que combina com você.`,
            '',
            `${EMOJIS.SHIELD} **Como funciona:**`,
            `${EMOJIS.PONTO_ROXO} Vou te fazer algumas perguntas aqui mesmo no chat`,
            `${EMOJIS.PONTO_ROXO} É só ir selecionando as opções`,
            `${EMOJIS.PONTO_ROXO} Seus treinadores vão ver seu perfil`,
            `${EMOJIS.PONTO_ROXO} Um deles vai te aceitar e você entra pro time dele`,
            '',
            `${EMOJIS.USERS} **Perguntas:**`,
            `${EMOJIS.PONTO_ROXO} Estilo de jogo que você quer desenvolver`,
            `${EMOJIS.PONTO_ROXO} Que tipo de treinador você curte`,
            `${EMOJIS.PONTO_ROXO} Plataforma, FPS e Ping`,
            `${EMOJIS.PONTO_ROXO} Seus horários disponíveis`,
            `${EMOJIS.PONTO_ROXO} Sua experiência no game`,
            '',
            `${EMOJIS.BANZADA} **Bora? Clica no botão e vamos começar!**`,
        ].join('\n');

        return new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} Treinamento AUGE`)
            .setDescription(description)
            .setImage(COACH_TICKET_GIF)
            .setFooter({ text: COACH_CONFIG.footerText })
            .setTimestamp();
    }

    static buildRequestEmbed(request: StudentRequest): EmbedBuilder {
        const { preferences } = request;

        return new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} NOVA SOLICITAÇÃO DE TREINO`)
            .setDescription(`${EMOJIS.PONTO_ROXO} <@${request.odUserId}> quer ser treinado!`)
            .setThumbnail(request.avatarUrl)
            .addFields(
                { name: `${EMOJIS.SHIELD} Estilo Desejado`, value: this.getGameStyleWithoutEmoji(preferences.gameStyle), inline: true },
                { name: `${EMOJIS.USERS} Tipo de Treinador`, value: this.getTeachingStyleWithoutEmoji(preferences.teachingStyle), inline: true },
                { name: `${EMOJIS.BANZADA} Main`, value: preferences.main || 'N/A', inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Plataforma`, value: this.getPlatformWithoutEmoji(preferences.platform), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} FPS`, value: preferences.fps, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Ping`, value: preferences.ping, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Experiência`, value: this.getExperienceWithoutEmoji(preferences.experience), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Disponibilidade`, value: preferences.availability.map(a => this.getAvailabilityWithoutEmoji(a)).join('\n'), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Conexão/Lag`, value: preferences.conexaoInfo || 'N/A', inline: false }
            )
            .setFooter({ text: COACH_CONFIG.footerText })
            .setTimestamp();
    }

    static buildRequestAcceptedEmbed(request: StudentRequest, coach: Coach): EmbedBuilder {
        const { preferences } = request;

        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`${EMOJIS.SETINHA_ROXA} SOLICITAÇÃO ACEITA`)
            .setDescription([
                `${EMOJIS.USERS} **Aluno:** <@${request.odUserId}>`,
                `${EMOJIS.SHIELD} **Treinador:** <@${coach.id}>`,
            ].join('\n'))
            .setThumbnail(request.avatarUrl)
            .addFields(
                { name: `${EMOJIS.SHIELD} Estilo Desejado`, value: this.getGameStyleWithoutEmoji(preferences.gameStyle), inline: true },
                { name: `${EMOJIS.USERS} Tipo de Treinador`, value: this.getTeachingStyleWithoutEmoji(preferences.teachingStyle), inline: true },
                { name: `${EMOJIS.BANZADA} Main`, value: preferences.main || 'N/A', inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Plataforma`, value: this.getPlatformWithoutEmoji(preferences.platform), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} FPS`, value: preferences.fps, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Ping`, value: preferences.ping, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Experiência`, value: this.getExperienceWithoutEmoji(preferences.experience), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Disponibilidade`, value: preferences.availability.map(a => this.getAvailabilityWithoutEmoji(a)).join('\n'), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Conexão/Lag`, value: preferences.conexaoInfo || 'N/A', inline: false }
            )
            .setFooter({ text: COACH_CONFIG.footerText })
            .setTimestamp();
    }

    static buildFormSubmittedEmbed(request: StudentRequest): EmbedBuilder {
        const { preferences } = request;

        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`${EMOJIS.SETINHA_ROXA} Formulário enviado com sucesso!`)
            .setDescription([
                `${EMOJIS.PONTO_ROXO} <@${request.odUserId}>`,
                '',
                `${EMOJIS.SHIELD} **Sua ficha de treinamento está pronta!**`,
                '',
                `${EMOJIS.PONTO_ROXO} Aguarde! Um treinador da AUGE vai analisar seu perfil.`,
                `${EMOJIS.PONTO_ROXO} Quando ele te aceitar, você vai receber acesso ao canal de treino dele!`,
                '',
                `${EMOJIS.USERS} **Enquanto isso, pode tirar dúvidas aqui no ticket.**`,
                `${EMOJIS.PONTO_ROXO} A Staff ou um Treinador pode te ajudar.`,
            ].join('\n'))
            .setThumbnail(request.avatarUrl)
            .addFields(
                { name: `${EMOJIS.SHIELD} Estilo Desejado`, value: this.getGameStyleWithoutEmoji(preferences.gameStyle), inline: true },
                { name: `${EMOJIS.USERS} Tipo de Treinador`, value: this.getTeachingStyleWithoutEmoji(preferences.teachingStyle), inline: true },
                { name: `${EMOJIS.BANZADA} Meu Main`, value: preferences.main || 'N/A', inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Plataforma`, value: this.getPlatformWithoutEmoji(preferences.platform), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} FPS`, value: preferences.fps, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Ping`, value: preferences.ping, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Experiência`, value: this.getExperienceWithoutEmoji(preferences.experience), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Disponibilidade`, value: preferences.availability.map(a => this.getAvailabilityWithoutEmoji(a)).join(', '), inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Conexão/Lag`, value: preferences.conexaoInfo || 'N/A', inline: false }
            )
            .setFooter({ text: `${EMOJIS.MARTELO} Staff/Treinador pode finalizar o ticket quando terminar.` });
    }

    static buildTrainingChannelEmbed(coach: Coach, studentMentions: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} TREINAMENTO AUGE`)
            .setDescription([
                `${EMOJIS.SHIELD} **Treinador:** <@${coach.id}>`,
                `${EMOJIS.USERS} **Alunos:** ${studentMentions}`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                `${EMOJIS.PONTO_ROXO} Este canal é exclusivo pra vocês organizarem os treinos.`,
                '',
                `${EMOJIS.BANZADA} Bora pra cima!`,
            ].join('\n'))
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildCoachProfileEmbed(coach: Coach): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} Perfil do Treinador`)
            .addFields(
                { name: `${EMOJIS.SHIELD} Treinador`, value: `<@${coach.id}>`, inline: true },
                { name: `${EMOJIS.USERS} Alunos`, value: `${coach.studentIds.length}`, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Canal`, value: `<#${coach.channelId}>`, inline: true }
            );

        if (coach.profile) {
            const gameStyles = Array.isArray(coach.profile.gameStyle)
                ? coach.profile.gameStyle.map(g => GAME_STYLE_DISPLAY[g]).join('\n')
                : GAME_STYLE_DISPLAY[coach.profile.gameStyle as keyof typeof GAME_STYLE_DISPLAY];

            embed.addFields(
                { name: `${EMOJIS.SHIELD} Estilo de Jogo`, value: gameStyles, inline: true },
                { name: `${EMOJIS.USERS} Jeito de Ensinar`, value: TEACHING_STYLE_DISPLAY[coach.profile.teachingStyle], inline: true },
                { name: `${EMOJIS.BANZADA} Main`, value: coach.profile.main, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Plataforma`, value: PLATFORM_DISPLAY[coach.profile.platform], inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Disponibilidade`, value: coach.profile.availability.map(a => AVAILABILITY_DISPLAY[a]).join('\n'), inline: false }
            );

            if (coach.profile.description) {
                embed.addFields({ name: `${EMOJIS.PONTO_ROXO} Descrição`, value: coach.profile.description, inline: false });
            }
        } else {
            embed.addFields({ name: `${EMOJIS.PONTO_ROXO} Perfil`, value: 'Não configurado. Use `/treinador perfil` para configurar.', inline: false });
        }

        return embed.setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildCoachListEmbed(coaches: Coach[]): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} TREINADORES DA AUGE`)
            .setFooter({ text: COACH_CONFIG.footerText });

        if (coaches.length === 0) {
            embed.setDescription(`${EMOJIS.PONTO_ROXO} Nenhum treinador cadastrado.`);
            return embed;
        }

        let totalStudents = 0;
        const coachList = coaches.map(coach => {
            totalStudents += coach.studentIds.length;
            let profileInfo = `${EMOJIS.PONTO_ROXO} Perfil não configurado`;

            if (coach.profile) {
                const gameStyles = Array.isArray(coach.profile.gameStyle)
                    ? coach.profile.gameStyle.map(g => GAME_STYLE_DISPLAY[g]).join(', ')
                    : GAME_STYLE_DISPLAY[coach.profile.gameStyle as keyof typeof GAME_STYLE_DISPLAY];
                profileInfo = `${EMOJIS.SHIELD} ${gameStyles} | ${EMOJIS.USERS} ${TEACHING_STYLE_DISPLAY[coach.profile.teachingStyle]}`;
            }

            return [
                `${EMOJIS.SETINHA_ROXA} <@${coach.id}>`,
                `${EMOJIS.PONTO_ROXO} Canal: <#${coach.channelId}>`,
                `${EMOJIS.USERS} Alunos: ${coach.studentIds.length}`,
                profileInfo,
            ].join('\n');
        });

        embed.setDescription(coachList.join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'));
        embed.addFields({ name: `${EMOJIS.BANZADA} Total`, value: `${coaches.length} treinadores | ${totalStudents} alunos`, inline: false });

        return embed;
    }

    static buildCoachDisplayEmbed(
        coach: Coach,
        avatarUrl?: string,
        feedbackStats?: { averageRating: number; totalReviews: number }
    ): EmbedBuilder {
        let ratingLine = '';
        if (feedbackStats && feedbackStats.totalReviews > 0) {
            ratingLine = `\n\n${EMOJIS.LIKE} **${feedbackStats.averageRating.toFixed(1)}/5** (${feedbackStats.totalReviews} avaliações)`;
        }

        const embed = new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} Treinador: ${coach.displayName}`)
            .setDescription(`${EMOJIS.PONTO_ROXO} <@${coach.id}>\n\nConheça mais sobre este treinador da AUGE!${ratingLine}`);

        if (avatarUrl) {
            embed.setThumbnail(avatarUrl);
        }

        if (coach.profile) {
            const gameStyles = Array.isArray(coach.profile.gameStyle)
                ? coach.profile.gameStyle.map(g => GAME_STYLE_DISPLAY[g]).join('\n')
                : GAME_STYLE_DISPLAY[coach.profile.gameStyle as keyof typeof GAME_STYLE_DISPLAY];

            const platformValue = this.getPlatformWithoutEmoji(coach.profile.platform);

            embed.addFields(
                { name: `${EMOJIS.SHIELD} Estilo de Jogo`, value: gameStyles, inline: true },
                { name: `${EMOJIS.USERS} Jeito de Ensinar`, value: TEACHING_STYLE_DISPLAY[coach.profile.teachingStyle], inline: true },
                { name: `${EMOJIS.BANZADA} Main`, value: coach.profile.main, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Plataforma`, value: platformValue, inline: true },
                { name: `${EMOJIS.PONTO_ROXO} Disponibilidade`, value: coach.profile.availability.map(a => this.getAvailabilityWithoutEmoji(a)).join('\n'), inline: true },
                { name: `${EMOJIS.USERS} Alunos`, value: `${coach.studentIds.length}`, inline: true }
            );
        }

        embed.setFooter({ text: COACH_CONFIG.footerText }).setTimestamp();
        return embed;
    }

    static buildStudentListEmbed(coach: Coach): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(`${EMOJIS.SETINHA_ROXA} Seus Alunos`)
            .setFooter({ text: COACH_CONFIG.footerText });

        if (coach.studentIds.length === 0) {
            embed.setDescription(`${EMOJIS.PONTO_ROXO} Você não tem alunos no momento.`);
            return embed;
        }

        const studentList = coach.studentIds.map((id, index) => `${EMOJIS.PONTO_ROXO} ${index + 1}. <@${id}>`).join('\n');
        embed.setDescription(studentList);
        embed.addFields({ name: `${EMOJIS.USERS} Total`, value: `${coach.studentIds.length} aluno(s)`, inline: false });

        return embed;
    }

    static buildLeaveConfirmEmbed(coachDisplayName: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(COACH_MESSAGES.LEAVE_CONFIRM_TITLE)
            .setDescription(COACH_MESSAGES.LEAVE_CONFIRM_DESC.replace('{coach}', `**${coachDisplayName}**`))
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildLeaveSuccessEmbed(coachDisplayName: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(COACH_MESSAGES.LEAVE_SUCCESS.replace('{coach}', coachDisplayName))
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildLeaveCancelledEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#888888')
            .setDescription(COACH_MESSAGES.LEAVE_CANCELLED)
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    static buildLeaveCoachChannelEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COACH_CONFIG.embedColor as `#${string}`)
            .setTitle(COACH_MESSAGES.LEAVE_EMBED_TITLE)
            .setDescription(COACH_MESSAGES.LEAVE_EMBED_DESC)
            .setImage(COACH_LEAVE_GIF)
            .setFooter({ text: COACH_CONFIG.footerText });
    }

    private static getPlatformWithoutEmoji(platform: string): string {
        const map: Record<string, string> = { pc: 'PC', console: 'Console', mobile: 'Mobile' };
        return map[platform] || platform;
    }

    private static getAvailabilityWithoutEmoji(availability: string): string {
        const map: Record<string, string> = {
            manha: 'Manhã (8h - 12h)',
            tarde: 'Tarde (12h - 18h)',
            noite: 'Noite (18h - 00h)',
            madrugada: 'Madrugada (00h - 8h)',
        };
        return map[availability] || availability;
    }

    private static getGameStyleWithoutEmoji(style: string): string {
        const map: Record<string, string> = { agressivo: 'Agressivo', passivo: 'Passivo', equilibrado: 'Equilibrado', clutch: 'Clutch' };
        return map[style] || style;
    }

    private static getTeachingStyleWithoutEmoji(style: string): string {
        const map: Record<string, string> = { rigido: 'Rígido', calmo: 'Calmo', direto: 'Direto', motivador: 'Motivador' };
        return map[style] || style;
    }

    private static getExperienceWithoutEmoji(exp: string): string {
        const map: Record<string, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
        return map[exp] || exp;
    }
}
