import { EmbedBuilder, Guild } from 'discord.js';
import { Training } from './types';
import { COLORS, EMOJIS } from '../../config';
import { trainingService } from './TrainingService';

export class TrainingEmbedBuilder {    private static getEmojis(type: 'normal' | 'feminino') {
        if (type === 'feminino') {
            return {
                setinha: EMOJIS.LACO_ROSA,
                ponto: EMOJIS.PONTO_ROSA,
                color: COLORS.FEMININO,
            };
        }
        return {
            setinha: EMOJIS.SETINHA_ROXA,
            ponto: EMOJIS.PONTO_ROXO,
            color: COLORS.PRIMARY,
        };
    }

    static buildInscricaoEmbed(training: Training): EmbedBuilder {
        const { setinha, ponto, color } = this.getEmojis(training.type);
        const participantMentions = training.participants.map(id => `<@${id}>`);
        const tipoLabel = training.type === 'feminino' 
            ? `${EMOJIS.LACO_ROSA} Treino Feminino` 
            : '🎮 Treino Normal';

        return new EmbedBuilder()
            .setTitle(`${tipoLabel} Aberto!`)
            .setDescription(
                `${ponto} **Participantes: ${training.participants.length}**\n\n` +
                (participantMentions.length > 0 
                    ? participantMentions.join(', ')
                    : '_Nenhum participante ainda_')
            )
            .setColor(color as `#${string}`)
            .setFooter({ text: 'Clique em Participar para entrar!' });
    }

    static buildSorteioEmbed(training: Training): EmbedBuilder {
        const { setinha, ponto, color } = this.getEmojis(training.type);
        const teamIcon = training.type === 'feminino' ? EMOJIS.LACO_ROSA : '🎯';
        
        const teamFields = training.teams.map((team) => {
            const playerMentions = team.players.map(id => `<@${id}>`);
            return {
                name: `${teamIcon} ${team.name}`,
                value: playerMentions.length > 0 
                    ? playerMentions.join('\n')
                    : '_Vazio_',
                inline: true,
            };
        });

        const bracketText = training.brackets
            .filter(b => b.team1 > 0 && b.team2 > 0)
            .map(b => `${ponto} **${b.phase}:** Time ${b.team1} 🆚 Time ${b.team2}`)
            .join('\n');

        const titleEmoji = training.type === 'feminino' ? EMOJIS.LACO_ROSA : '🎲';

        return new EmbedBuilder()
            .setTitle(`${titleEmoji} Times Sorteados!`)
            .setDescription(`${ponto} **${training.teams.length} times formados**`)
            .addFields(teamFields)
            .addFields({ name: `${ponto} Chaveamento`, value: bracketText || 'Será definido', inline: false })
            .setColor(color as `#${string}`)
            .setFooter({ text: 'Clique em Confirmar para iniciar ou Sortear Novamente' });
    }

    static buildPartidaEmbed(training: Training): EmbedBuilder {
        const { setinha, ponto, color } = this.getEmojis(training.type);
        const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
        
        if (pendingBrackets.length === 0) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Nenhuma partida pendente');
        }

        const currentPhase = pendingBrackets[0].phase.split(' ')[0];
        
        const fields: { name: string; value: string; inline: boolean }[] = [];
        // Bolinhas preta e branca sempre (não muda no feminino)
        const teamIcon1 = '⚫';
        const teamIcon2 = '⚪';

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
                name: `${teamIcon1} ${team1?.name || '?'}`,
                value: team1Mentions,
                inline: true,
            });

            fields.push({
                name: `${teamIcon2} ${team2?.name || '?'}`,
                value: team2Mentions,
                inline: true,
            });

            if (index < pendingBrackets.length - 1) {
                fields.push({ name: '\u200b', value: '─'.repeat(20), inline: false });
            }
        });

        const resolvedCount = pendingBrackets.filter(b => b.winner).length;
        const totalCount = pendingBrackets.length;
        const titleIcon = training.type === 'feminino' ? EMOJIS.LACO_ROSA : '📊';

        return new EmbedBuilder()
            .setTitle(`${titleIcon} ${currentPhase} (${resolvedCount}/${totalCount} definidas)`)
            .setDescription(`${ponto} Defina o vencedor de cada partida:`)
            .addFields(fields)
            .setColor(color as `#${string}`)
            .setFooter({ text: 'Clique no time vencedor de cada partida' });
    }

    static buildFinalizadoEmbed(training: Training): EmbedBuilder {
        const { setinha, ponto, color } = this.getEmojis(training.type);
        const championTeam = training.teams.find(t => t.id === training.champion);
        const championMentions = championTeam 
            ? championTeam.players.map(id => `<@${id}>`)
            : [];

        const highlightMentions = training.highlights.map(id => `<@${id}>`);
        
        const mvpMention = training.mvpId ? `<@${training.mvpId}>` : 'Não definido';
        
        const trophyIcon = training.type === 'feminino' ? EMOJIS.LACO_ROSA : '🏆';
        const goldIcon = training.type === 'feminino' ? EMOJIS.PONTO_ROSA : '🥇';
        const starIcon = training.type === 'feminino' ? EMOJIS.LACO_ROSA : '⭐';
        const mvpIcon = training.type === 'feminino' ? EMOJIS.PONTO_ROSA : '🏅';
        const titleText = training.type === 'feminino' ? 'TREINO FEMININO FINALIZADO!' : 'TREINO FINALIZADO!';

        return new EmbedBuilder()
            .setTitle(`${trophyIcon} ${titleText}`)
            .setDescription(
                `**${goldIcon} Campeão: ${championTeam?.name || 'Desconhecido'}**\n` +
                (championMentions.length > 0 
                    ? championMentions.join(', ')
                    : '')
            )
            .addFields(
                {
                    name: `${starIcon} Destaques`,
                    value: highlightMentions.length > 0 
                        ? highlightMentions.join('\n')
                        : '_Nenhum destaque_',
                    inline: true,
                },
                {
                    name: `${mvpIcon} MVP`,
                    value: mvpMention,
                    inline: true,
                }
            )
            .setColor(training.type === 'feminino' ? COLORS.FEMININO as `#${string}` : COLORS.SUCCESS as `#${string}`)
            .setTimestamp();
    }
}
