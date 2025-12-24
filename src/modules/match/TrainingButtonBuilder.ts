import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TrainingButtonBuilder {
    static buildInscricaoButtons(): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_participar')
                    .setLabel('✅ Participar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('treino_sair')
                    .setLabel('❌ Sair')
                    .setStyle(ButtonStyle.Danger),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_sortear')
                    .setLabel('🎲 Sortear Times')
                    .setStyle(ButtonStyle.Primary),
            ],
        });

        return [row1, row2];
    }

    static buildTeamCountButtons(participantCount: number): ActionRowBuilder<ButtonBuilder>[] {
        const minPlayersPerTeam = 2;

        const canUseTeams = (teamCount: number) => {
            const isDivisible = participantCount % teamCount === 0;
            const hasMinPlayers = participantCount >= teamCount * minPlayersPerTeam;
            return isDivisible && hasMinPlayers;
        };

        const getLabel = (teamCount: number) => {
            if (!canUseTeams(teamCount)) return `${teamCount} times`;
            const playersPerTeam = participantCount / teamCount;
            return `${teamCount} times (${playersPerTeam}v${playersPerTeam})`;
        };

        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_times_2')
                    .setLabel(getLabel(2))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(2)),
                new ButtonBuilder()
                    .setCustomId('treino_times_3')
                    .setLabel(getLabel(3))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(3)),
                new ButtonBuilder()
                    .setCustomId('treino_times_4')
                    .setLabel(getLabel(4))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(4)),
                new ButtonBuilder()
                    .setCustomId('treino_times_5')
                    .setLabel(getLabel(5))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(5)),
                new ButtonBuilder()
                    .setCustomId('treino_times_6')
                    .setLabel(getLabel(6))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(6)),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_voltar')
                    .setLabel('⬅️ Voltar')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('treino_remover_participante')
                    .setLabel('🗑️ Remover Participante')
                    .setStyle(ButtonStyle.Danger),
            ],
        });

        return [row1, row2];
    }

    static buildCaptainLimitButtons(
        teamCount: number, 
        captainsParticipating: number
    ): ActionRowBuilder<ButtonBuilder>[] {
        const canUse1PerTeam = captainsParticipating >= teamCount;
        const canUse2PerTeam = captainsParticipating >= teamCount * 2;
        const hasAnyCaptain = captainsParticipating > 0;

        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_captain_0')
                    .setLabel('Sem Capitão')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('treino_captain_1')
                    .setLabel(`1 por time ${!canUse1PerTeam ? '(faltam)' : ''}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!canUse1PerTeam),
                new ButtonBuilder()
                    .setCustomId('treino_captain_2')
                    .setLabel(`2 por time ${!canUse2PerTeam ? '(faltam)' : ''}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!canUse2PerTeam),
                new ButtonBuilder()
                    .setCustomId('treino_captain_99')
                    .setLabel('Sem limite')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!hasAnyCaptain),
            ],
        });

        return [row1];
    }

    static buildSorteioButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_ressortear')
                    .setLabel('🔄 Sortear Novamente')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('treino_confirmar')
                    .setLabel('✅ Confirmar Times')
                    .setStyle(ButtonStyle.Success),
            ],
        });
    }

    static buildPartidaButtons(
        brackets: { bracketIndex: number; team1Id: number; team2Id: number; team1Name: string; team2Name: string; resolved: boolean; hasRoom: boolean }[]
    ): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        const unresolvedBrackets = brackets.filter(b => !b.resolved);

        if (unresolvedBrackets.length > 0) {
            const roomRow = new ActionRowBuilder<ButtonBuilder>({
                components: unresolvedBrackets.slice(0, 5).map(bracket => 
                    new ButtonBuilder()
                        .setCustomId(`treino_sala_${bracket.bracketIndex}`)
                        .setLabel(`🔑 Código ${bracket.bracketIndex + 1}`)
                        .setStyle(bracket.hasRoom ? ButtonStyle.Success : ButtonStyle.Secondary)
                ),
            });
            rows.push(roomRow);
        }

        for (const bracket of unresolvedBrackets) {
            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(`treino_vencedor_${bracket.bracketIndex}_${bracket.team1Id}`)
                        .setLabel(`🔵 ${bracket.team1Name}`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`treino_vencedor_${bracket.bracketIndex}_${bracket.team2Id}`)
                        .setLabel(`🔴 ${bracket.team2Name}`)
                        .setStyle(ButtonStyle.Danger),
                ],
            });
            rows.push(row);
        }

        if (unresolvedBrackets.length === 0) {
            rows.push(new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId('treino_proxima_fase')
                        .setLabel('➡️ Próxima Fase')
                        .setStyle(ButtonStyle.Success),
                ],
            }));
        }

        return rows;
    }

    static buildFinalizadoButtons(mvpDefinido: boolean): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_add_destaque')
                    .setLabel('➕ Adicionar Destaque')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('treino_definir_mvp')
                    .setLabel('🏅 Definir MVP')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(mvpDefinido),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId('treino_finalizar')
                    .setLabel('✅ Finalizar Treino')
                    .setStyle(ButtonStyle.Success),
            ],
        });

        return [row1, row2];
    }
}

