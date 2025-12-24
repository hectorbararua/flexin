import { EmbedBuilder, Guild } from 'discord.js';
import { Training } from './types';
import { COLORS } from '../../config';
import { trainingService } from './TrainingService';

export class TrainingEmbedBuilder {
    static buildInscricaoEmbed(training: Training): EmbedBuilder {
        const participantMentions = training.participants.map(id => `<@${id}>`);

        return new EmbedBuilder()
            .setTitle('🎮 Treino Aberto!')
            .setDescription(
                `**Participantes: ${training.participants.length}**\n\n` +
                (participantMentions.length > 0 
                    ? participantMentions.join(', ')
                    : '_Nenhum participante ainda_')
            )
            .setColor(COLORS.PRIMARY as `#${string}`)
            .setFooter({ text: 'Clique em Participar para entrar!' });
    }

    static buildSorteioEmbed(training: Training): EmbedBuilder {
        const teamFields = training.teams.map((team) => {
            const playerMentions = team.players.map(id => `<@${id}>`);
            return {
                name: `🎯 ${team.name}`,
                value: playerMentions.length > 0 
                    ? playerMentions.join('\n')
                    : '_Vazio_',
                inline: true,
            };
        });

        const bracketText = training.brackets
            .filter(b => b.team1 > 0 && b.team2 > 0)
            .map(b => `**${b.phase}:** Time ${b.team1} 🆚 Time ${b.team2}`)
            .join('\n');

        return new EmbedBuilder()
            .setTitle('🎲 Times Sorteados!')
            .setDescription(`**${training.teams.length} times formados**`)
            .addFields(teamFields)
            .addFields({ name: '📊 Chaveamento', value: bracketText || 'Será definido', inline: false })
            .setColor(COLORS.PRIMARY as `#${string}`)
            .setFooter({ text: 'Clique em Confirmar para iniciar ou Sortear Novamente' });
    }

    static buildPartidaEmbed(training: Training): EmbedBuilder {
        const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
        
        if (pendingBrackets.length === 0) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Nenhuma partida pendente');
        }

        const currentPhase = pendingBrackets[0].phase.split(' ')[0];
        
        const fields: { name: string; value: string; inline: boolean }[] = [];

        pendingBrackets.forEach((bracket, index) => {
            const team1 = trainingService.getTeamForBracket(training, bracket.team1);
            const team2 = trainingService.getTeamForBracket(training, bracket.team2);

            const team1Mentions = team1 ? team1.players.map(id => `<@${id}>`).join('\n') : '_Aguardando_';
            const team2Mentions = team2 ? team2.players.map(id => `<@${id}>`).join('\n') : '_Aguardando_';

            const status = bracket.winner ? '✅' : '⏳';
            const winnerText = bracket.winner 
                ? `\n**Vencedor:** ${training.teams.find(t => t.id === bracket.winner)?.name}`
                : '';
            const roomText = bracket.roomCode 
                ? `\n🔑 **Código:** \`${bracket.roomCode}\``
                : '\n🔑 _Código não definido_';

            fields.push({
                name: `${status} ${bracket.phase}`,
                value: `**${team1?.name || '?'} 🆚 ${team2?.name || '?'}**${roomText}${winnerText}`,
                inline: false,
            });

            fields.push({
                name: `🔵 ${team1?.name || '?'}`,
                value: team1Mentions,
                inline: true,
            });

            fields.push({
                name: `🔴 ${team2?.name || '?'}`,
                value: team2Mentions,
                inline: true,
            });

            if (index < pendingBrackets.length - 1) {
                fields.push({ name: '\u200b', value: '─'.repeat(20), inline: false });
            }
        });

        const resolvedCount = pendingBrackets.filter(b => b.winner).length;
        const totalCount = pendingBrackets.length;

        return new EmbedBuilder()
            .setTitle(`📊 ${currentPhase} (${resolvedCount}/${totalCount} definidas)`)
            .setDescription('Defina o vencedor de cada partida:')
            .addFields(fields)
            .setColor(COLORS.PRIMARY as `#${string}`)
            .setFooter({ text: 'Clique no time vencedor de cada partida' });
    }

    static buildFinalizadoEmbed(training: Training): EmbedBuilder {
        const championTeam = training.teams.find(t => t.id === training.champion);
        const championMentions = championTeam 
            ? championTeam.players.map(id => `<@${id}>`)
            : [];

        const highlightMentions = training.highlights.map(id => `<@${id}>`);
        
        const mvpMention = training.mvpId ? `<@${training.mvpId}>` : 'Não definido';

        return new EmbedBuilder()
            .setTitle('🏆 TREINO FINALIZADO!')
            .setDescription(
                `**🥇 Campeão: ${championTeam?.name || 'Desconhecido'}**\n` +
                (championMentions.length > 0 
                    ? championMentions.join(', ')
                    : '')
            )
            .addFields(
                {
                    name: '⭐ Destaques',
                    value: highlightMentions.length > 0 
                        ? highlightMentions.join('\n')
                        : '_Nenhum destaque_',
                    inline: true,
                },
                {
                    name: '🏅 MVP',
                    value: mvpMention,
                    inline: true,
                }
            )
            .setColor(COLORS.SUCCESS as `#${string}`)
            .setTimestamp();
    }
}
