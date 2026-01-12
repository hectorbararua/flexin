import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TRAINING_CUSTOM_IDS } from './constants';

export class TrainingButtonBuilder {
    static buildInscricaoButtons(): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.PARTICIPAR)
                    .setLabel('✅ Participar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.SAIR)
                    .setLabel('❌ Sair')
                    .setStyle(ButtonStyle.Danger),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.SORTEAR)
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
                    .setCustomId('treino_times_7')
                    .setLabel(getLabel(7))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(7)),
                new ButtonBuilder()
                    .setCustomId('treino_times_8')
                    .setLabel(getLabel(8))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(8)),
                new ButtonBuilder()
                    .setCustomId('treino_times_9')
                    .setLabel(getLabel(9))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(9)),
                new ButtonBuilder()
                    .setCustomId('treino_times_10')
                    .setLabel(getLabel(10))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!canUseTeams(10)),
            ],
        });

        const row3 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.VOLTAR)
                    .setLabel('⬅️ Voltar')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.REMOVER_PARTICIPANTE)
                    .setLabel('🗑️ Remover Participante')
                    .setStyle(ButtonStyle.Danger),
            ],
        });

        return [row1, row2, row3];
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

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.VOLTAR_TIMES)
                    .setLabel('⬅️ Voltar')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });

        return [row1, row2];
    }

    static buildSorteioButtons(): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.RESSORTEAR)
                    .setLabel('🔄 Ressortear')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.CONFIRMAR)
                    .setLabel('✅ Confirmar')
                    .setStyle(ButtonStyle.Success),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.TROCAR_JOGADORES)
                    .setLabel('🔀 Trocar')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.ADICIONAR_JOGADOR)
                    .setLabel('➕ Adicionar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.REMOVER_DO_TIME)
                    .setLabel('➖ Remover')
                    .setStyle(ButtonStyle.Danger),
            ],
        });

        const row3 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.VOLTAR_CAPITAES)
                    .setLabel('⬅️ Voltar')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });

        return [row1, row2, row3];
    }

    static buildPartidaButtons(
        brackets: { bracketIndex: number; team1Id: number; team2Id: number; team1Name: string; team2Name: string; resolved: boolean; hasRoom: boolean }[],
        hasResolvedBrackets: boolean = false
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
                        .setLabel(`⚫ ${bracket.team1Name}`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`treino_vencedor_${bracket.bracketIndex}_${bracket.team2Id}`)
                        .setLabel(`⚪ ${bracket.team2Name}`)
                        .setStyle(ButtonStyle.Primary),
                ],
            });
            rows.push(row);
        }

        if (unresolvedBrackets.length === 0) {
            rows.push(new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(TRAINING_CUSTOM_IDS.PROXIMA_FASE)
                        .setLabel('➡️ Próxima Fase')
                        .setStyle(ButtonStyle.Success),
                ],
            }));
        }

        if (rows.length < 5) {
            const actionButtons: ButtonBuilder[] = [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.MOVER_TIMES)
                    .setLabel('📢 Mover Times')
                    .setStyle(ButtonStyle.Secondary),
            ];

            if (hasResolvedBrackets) {
                actionButtons.push(
                    new ButtonBuilder()
                        .setCustomId(TRAINING_CUSTOM_IDS.DESFAZER_VENCEDOR)
                        .setLabel('↩️ Desfazer')
                        .setStyle(ButtonStyle.Danger)
                );
            }

            actionButtons.push(
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.VOLTAR_SORTEIO)
                    .setLabel('⬅️ Voltar')
                    .setStyle(ButtonStyle.Secondary)
            );

            rows.push(new ActionRowBuilder<ButtonBuilder>({
                components: actionButtons,
            }));
        }

        return rows;
    }

    static buildFinalizadoButtons(mvpDefinido: boolean, temDestaques: boolean): ActionRowBuilder<ButtonBuilder>[] {
        const row1 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.ADD_DESTAQUE)
                    .setLabel('➕ Destaque')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.REMOVER_DESTAQUE)
                    .setLabel('➖ Destaque')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!temDestaques),
            ],
        });

        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(mvpDefinido ? TRAINING_CUSTOM_IDS.TROCAR_MVP : TRAINING_CUSTOM_IDS.DEFINIR_MVP)
                    .setLabel(mvpDefinido ? '🔄 Trocar MVP' : '🏅 Definir MVP')
                    .setStyle(ButtonStyle.Primary),
            ],
        });

        const row3 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(TRAINING_CUSTOM_IDS.FINALIZAR)
                    .setLabel('✅ Finalizar Treino')
                    .setStyle(ButtonStyle.Success),
            ],
        });

        return [row1, row2, row3];
    }
}
