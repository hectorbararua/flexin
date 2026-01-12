import { 
    ActionRowBuilder,
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    ButtonInteraction,
    CacheType,
    Collection,
    GuildMember,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    TextChannel
} from 'discord.js';
import { Command } from '../../core/types';
import { PermissionGuard } from '../../shared';
import { trainingService } from './TrainingService';
import { TrainingEmbedBuilder } from './TrainingEmbedBuilder';
import { TrainingButtonBuilder } from './TrainingButtonBuilder';
import { captainsRepository } from '../captains/CaptainsRepository';
import { TRAINING_CUSTOM_IDS } from './constants';
import { TrainingType } from './types';
import { SPECIAL_ROLES } from '../../config/roles';

export default new Command({
    name: 'iniciar',
    description: 'Inicia um treino',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'tipo',
            description: 'Tipo do treino',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: '🎮 Normal', value: 'normal' },
                { name: '🎀 Feminino', value: 'feminino' },
            ],
        },
    ],

    async run({ interaction, options }) {
        if (!PermissionGuard.canUseCommand(interaction)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                flags: 64,
            });
            return;
        }

        await interaction.deferReply();

        const tipo = (options.getString('tipo') || 'normal') as TrainingType;
        const training = trainingService.createTraining(interaction.id, tipo);
        const embed = TrainingEmbedBuilder.buildInscricaoEmbed(training);
        const buttons = TrainingButtonBuilder.buildInscricaoButtons();

        const message = await interaction.editReply({
            content: '',
            embeds: [embed],
            components: buttons.map(r => r.toJSON()),
        });

        trainingService.updateMessageId(interaction.id, message.id);
    },

    buttons: new Collection([
        [TRAINING_CUSTOM_IDS.PARTICIPAR, handleParticipar],
        [TRAINING_CUSTOM_IDS.SAIR, handleSair],
        [TRAINING_CUSTOM_IDS.SORTEAR, handleSortear],
        [TRAINING_CUSTOM_IDS.VOLTAR, handleVoltar],
        [TRAINING_CUSTOM_IDS.VOLTAR_TIMES, handleVoltarTimes],
        [TRAINING_CUSTOM_IDS.VOLTAR_CAPITAES, handleVoltarCapitaes],
        [TRAINING_CUSTOM_IDS.VOLTAR_SORTEIO, handleVoltarSorteio],
        [TRAINING_CUSTOM_IDS.REMOVER_PARTICIPANTE, handleRemoverParticipante],
        ['treino_times_2', (i) => handleTeamCount(i, 2)],
        ['treino_times_3', (i) => handleTeamCount(i, 3)],
        ['treino_times_4', (i) => handleTeamCount(i, 4)],
        ['treino_times_5', (i) => handleTeamCount(i, 5)],
        ['treino_times_6', (i) => handleTeamCount(i, 6)],
        ['treino_times_7', (i) => handleTeamCount(i, 7)],
        ['treino_times_8', (i) => handleTeamCount(i, 8)],
        ['treino_times_9', (i) => handleTeamCount(i, 9)],
        ['treino_times_10', (i) => handleTeamCount(i, 10)],
        ['treino_captain_0', (i) => handleCaptainLimit(i, 0)],
        ['treino_captain_1', (i) => handleCaptainLimit(i, 1)],
        ['treino_captain_2', (i) => handleCaptainLimit(i, 2)],
        ['treino_captain_99', (i) => handleCaptainLimit(i, 99)],
        [TRAINING_CUSTOM_IDS.RESSORTEAR, handleRessortear],
        [TRAINING_CUSTOM_IDS.CONFIRMAR, handleConfirmar],
        [TRAINING_CUSTOM_IDS.TROCAR_JOGADORES, handleTrocarJogadores],
        [TRAINING_CUSTOM_IDS.ADICIONAR_JOGADOR, handleAdicionarJogador],
        [TRAINING_CUSTOM_IDS.REMOVER_DO_TIME, handleRemoverDoTime],
        [TRAINING_CUSTOM_IDS.MOVER_TIMES, handleMoverTimes],
        [TRAINING_CUSTOM_IDS.ADD_DESTAQUE, handleAddDestaque],
        [TRAINING_CUSTOM_IDS.REMOVER_DESTAQUE, handleRemoverDestaque],
        [TRAINING_CUSTOM_IDS.DEFINIR_MVP, handleDefinirMvp],
        [TRAINING_CUSTOM_IDS.TROCAR_MVP, handleTrocarMvp],
        [TRAINING_CUSTOM_IDS.FINALIZAR, handleFinalizar],
        [TRAINING_CUSTOM_IDS.PROXIMA_FASE, handleProximaFase],
        [TRAINING_CUSTOM_IDS.DESFAZER_VENCEDOR, handleDesfazerVencedor],
    ]),

    selects: new Collection([
        ['treino_select_destaque', handleSelectDestaque],
        ['treino_select_mvp', handleSelectMvp],
        ['treino_select_remover', handleSelectRemover],
        ['treino_select_captains', handleSelectCaptains],
        [TRAINING_CUSTOM_IDS.SELECT_TROCAR_ORIGEM, handleSelectTrocarOrigem],
        [TRAINING_CUSTOM_IDS.SELECT_TROCAR_DESTINO, handleSelectTrocarDestino],
        [TRAINING_CUSTOM_IDS.SELECT_ADICIONAR_JOGADOR, handleSelectAdicionarJogador],
        [TRAINING_CUSTOM_IDS.SELECT_ADICIONAR_TIME, handleSelectAdicionarTime],
        [TRAINING_CUSTOM_IDS.SELECT_REMOVER_DO_TIME, handleSelectRemoverDoTime],
        [TRAINING_CUSTOM_IDS.SELECT_REMOVER_DESTAQUE, handleSelectRemoverDestaque],
        [TRAINING_CUSTOM_IDS.SELECT_DESFAZER_VENCEDOR, handleSelectDesfazerVencedor],
    ]),
});

async function handleParticipar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        await interaction.deferUpdate().catch(() => {});

        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.followUp({ content: 'Treino não encontrado.', flags: 64 }).catch(() => {});
            return;
        }

        // Verifica se o treino é feminino e se a pessoa tem o cargo
        if (training.type === 'feminino') {
            const member = interaction.member as GuildMember;
            if (!member.roles.cache.has(SPECIAL_ROLES.FEMININO)) {
                await interaction.followUp({ 
                    content: '❌ Este treino é exclusivo para membros com o cargo **Feminino**!', 
                    flags: 64 
                }).catch(() => {});
                return;
            }
        }

        const added = trainingService.addParticipant(interaction.message.id, interaction.user.id);
        if (!added) {
            await interaction.followUp({ content: 'Você já está participando!', flags: 64 }).catch(() => {});
            return;
        }

        // Usa debounce para juntar múltiplos cliques em uma única atualização
        const message = interaction.message;
        trainingService.scheduleEmbedUpdate(interaction.message.id, async () => {
            const currentTraining = trainingService.getTraining(message.id);
            if (!currentTraining) return;

            const embed = TrainingEmbedBuilder.buildInscricaoEmbed(currentTraining);
            const buttons = TrainingButtonBuilder.buildInscricaoButtons();

            try {
                await message.edit({
                    embeds: [embed],
                    components: buttons.map(r => r.toJSON()),
                });
            } catch (editError) {
                console.error('[Treino] Falha ao atualizar embed:', editError);
            }
        });
    } catch (error) {
        console.error('[Treino] Erro crítico ao participar:', error, 'User:', interaction.user.id);
    }
}

async function handleSair(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        await interaction.deferUpdate().catch(() => {});

        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.followUp({ content: 'Treino não encontrado.', flags: 64 }).catch(() => {});
            return;
        }

        const removed = trainingService.removeParticipant(interaction.message.id, interaction.user.id);
        if (!removed) {
            await interaction.followUp({ content: 'Você não está participando!', flags: 64 }).catch(() => {});
            return;
        }

        // Usa debounce para juntar múltiplos cliques em uma única atualização
        const message = interaction.message;
        trainingService.scheduleEmbedUpdate(interaction.message.id, async () => {
            const currentTraining = trainingService.getTraining(message.id);
            if (!currentTraining) return;

            const embed = TrainingEmbedBuilder.buildInscricaoEmbed(currentTraining);
            const buttons = TrainingButtonBuilder.buildInscricaoButtons();

            try {
                await message.edit({
                    embeds: [embed],
                    components: buttons.map(r => r.toJSON()),
                });
            } catch (editError) {
                console.error('[Treino] Falha ao atualizar embed:', editError);
            }
        });
    } catch (error) {
        console.error('[Treino] Erro crítico ao sair:', error, 'User:', interaction.user.id);
    }
}

async function handleSortear(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        if (!PermissionGuard.canRemovePlayer(interaction)) {
            await interaction.reply({ content: 'Você não tem permissão para sortear times.', flags: 64 });
            return;
        }

        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
            return;
        }

        if (training.participants.length < 4) {
            await interaction.reply({ content: '❌ Mínimo de **4 participantes** para sortear!\n(2 jogadores por time × 2 times)', flags: 64 });
            return;
        }

        const rows = TrainingButtonBuilder.buildTeamCountButtons(training.participants.length);

        await interaction.update({
            content: `**Quantos times?** (${training.participants.length} participantes)`,
            embeds: [],
            components: rows.map(r => r.toJSON()),
        });
    } catch {}
}

async function handleVoltar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
            return;
        }

        const embed = TrainingEmbedBuilder.buildInscricaoEmbed(training);
        const buttons = TrainingButtonBuilder.buildInscricaoButtons();

        await interaction.update({
            content: '',
            embeds: [embed],
            components: buttons.map(r => r.toJSON()),
        });
    } catch {}
}

async function handleVoltarTimes(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
            return;
        }

        const rows = TrainingButtonBuilder.buildTeamCountButtons(training.participants.length);

        await interaction.update({
            content: `**Quantos times?** (${training.participants.length} participantes)`,
            embeds: [],
            components: rows.map(r => r.toJSON()),
        });
    } catch {}
}

async function handleVoltarCapitaes(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const teamCount = trainingService.getPendingTeamCount(interaction.message.id);
    if (!teamCount) {
        await handleVoltarTimes(interaction);
        return;
    }

    const allCaptains = captainsRepository.getAll();
    const captainsParticipating = training.participants.filter(p => allCaptains.includes(p)).length;
    const rows = TrainingButtonBuilder.buildCaptainLimitButtons(teamCount, captainsParticipating);
    const playersPerTeam = training.participants.length / teamCount;

    await interaction.update({
        content: `**${teamCount} times** (${playersPerTeam}v${playersPerTeam})\n👑 Capitães participando: **${captainsParticipating}**\n\n👑 **Modo de sorteio:**`,
        embeds: [],
        components: rows.map(r => r.toJSON()),
    });
}

async function handleVoltarSorteio(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.revertToSorteio(interaction.message.id);

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await interaction.update({
        content: '',
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleRemoverParticipante(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
        if (!PermissionGuard.canRemovePlayer(interaction)) {
            await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
            return;
        }

        const training = trainingService.getTraining(interaction.message.id);
        if (!training) {
            await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
            return;
        }

        if (training.participants.length === 0) {
            await interaction.reply({ content: 'Não há participantes para remover.', flags: 64 });
            return;
        }

        await interaction.deferReply({ flags: 64 });

        const names = await trainingService.getMemberNames(interaction.guild!, training.participants.slice(0, 25));
        const options = training.participants.slice(0, 25).map((playerId) => 
            new StringSelectMenuOptionBuilder().setLabel(names.get(playerId) || 'Desconhecido').setValue(playerId)
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('treino_select_remover')
            .setPlaceholder('Escolha um participante para remover')
            .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

        await interaction.editReply({
            content: '🗑️ Escolha um participante para remover:',
            components: [row.toJSON()],
        });
    } catch {}
}

async function handleSelectRemover(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.removeParticipant(trainingMessage.id, playerId);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const rows = TrainingButtonBuilder.buildTeamCountButtons(training.participants.length);

    await trainingMessage.edit({
        content: `**Quantos times?** (${training.participants.length} participantes)`,
        embeds: [],
        components: rows.map(r => r.toJSON()),
    });

    await interaction.update({ content: `✅ <@${playerId}> removido!`, components: [] });
}

async function handleTeamCount(interaction: ButtonInteraction<CacheType>, count: number): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const minPlayersNeeded = count * 2;
    const isDivisible = training.participants.length % count === 0;

    if (training.participants.length < minPlayersNeeded || !isDivisible) {
        await interaction.reply({ 
            content: `❌ Não é possível criar ${count} times equilibrados com ${training.participants.length} participantes!`, 
            flags: 64 
        });
        return;
    }

    trainingService.setPendingTeamCount(interaction.message.id, count);

    const allCaptains = captainsRepository.getAll();
    const captainsParticipating = training.participants.filter(p => allCaptains.includes(p)).length;

    const rows = TrainingButtonBuilder.buildCaptainLimitButtons(count, captainsParticipating);

    const playersPerTeam = training.participants.length / count;

    await interaction.update({
        content: `**${count} times** (${playersPerTeam}v${playersPerTeam})\n👑 Capitães participando: **${captainsParticipating}**\n\n👑 **Modo de sorteio:**`,
        embeds: [],
        components: rows.map(r => r.toJSON()),
    });
}

async function handleCaptainLimit(interaction: ButtonInteraction<CacheType>, limit: number): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const teamCount = trainingService.getPendingTeamCount(interaction.message.id);
    if (!teamCount) {
        await interaction.reply({ content: 'Erro: quantidade de times não definida.', flags: 64 });
        return;
    }

    const captainsParticipating = trainingService.getCaptainsParticipating(interaction.message.id);
    const requiredCaptains = trainingService.getRequiredCaptains(teamCount, limit);

    if (limit > 0 && limit !== 99 && captainsParticipating.length > requiredCaptains) {
        trainingService.setPendingCaptainLimit(interaction.message.id, limit);

        const options = await Promise.all(
            captainsParticipating.slice(0, 25).map(async (playerId) => {
                let name = 'Desconhecido';
                try {
                    const member = await interaction.guild!.members.fetch(playerId);
                    name = member.displayName || member.user.username;
                } catch {}
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`👑 ${name}`)
                    .setValue(playerId);
            })
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('treino_select_captains')
            .setPlaceholder(`Escolha ${requiredCaptains} capitães para balancear`)
            .setMinValues(requiredCaptains)
            .setMaxValues(requiredCaptains)
            .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

        await interaction.update({
            content: `👑 **Escolha ${requiredCaptains} capitães** para balancear nos times:\n\n_Os outros serão tratados como jogadores normais._`,
            embeds: [],
            components: [row.toJSON()],
        });
        return;
    }

    if (limit === 99) {
        trainingService.setSelectedCaptains(interaction.message.id, captainsParticipating);
    } else if (limit > 0) {
        trainingService.setSelectedCaptains(interaction.message.id, captainsParticipating.slice(0, requiredCaptains));
    } else {
        trainingService.setSelectedCaptains(interaction.message.id, []);
    }

    trainingService.shuffleTeams(interaction.message.id, teamCount, limit);

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await interaction.update({
        content: '',
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleSelectCaptains(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const selectedCaptains = interaction.values;

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const teamCount = trainingService.getPendingTeamCount(interaction.message.id);
    const limit = trainingService.getPendingCaptainLimit(interaction.message.id);

    if (!teamCount || limit === undefined) {
        await interaction.reply({ content: 'Erro: configuração não encontrada.', flags: 64 });
        return;
    }

    trainingService.setSelectedCaptains(interaction.message.id, selectedCaptains);
    trainingService.shuffleTeams(interaction.message.id, teamCount, limit);

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await interaction.update({
        content: '',
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleRessortear(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.shuffleTeams(interaction.message.id, training.teams.length);

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await interaction.update({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleConfirmar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.confirmTeams(interaction.message.id);

    await updatePartidaDisplay(interaction);
}

async function handleTrocarJogadores(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const team of training.teams) {
        for (const playerId of team.players) {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${team.name} - ${name}`)
                    .setValue(`${team.id}_${playerId}`)
            );
        }
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_TROCAR_ORIGEM)
        .setPlaceholder('Escolha o PRIMEIRO jogador para trocar')
        .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '🔀 **Trocar Jogadores**\nEscolha o primeiro jogador:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectTrocarOrigem(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const [teamIdStr, playerId] = interaction.values[0].split('_');
    const teamId = parseInt(teamIdStr);

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.setPendingSwap(trainingMessage.id, playerId, teamId);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const team of training.teams) {
        if (team.id === teamId) continue;
        for (const pid of team.players) {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(pid);
                name = member.displayName || member.user.username;
            } catch {}
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${team.name} - ${name}`)
                    .setValue(`${team.id}_${pid}`)
            );
        }
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_TROCAR_DESTINO)
        .setPlaceholder('Escolha o SEGUNDO jogador para trocar')
        .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.update({
        content: '🔀 **Trocar Jogadores**\nAgora escolha o segundo jogador (de outro time):',
        components: [row.toJSON()],
    });
}

async function handleSelectTrocarDestino(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const [, player2Id] = interaction.values[0].split('_');

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const pendingSwap = trainingService.getPendingSwap(trainingMessage.id);
    if (!pendingSwap) {
        await interaction.update({ content: '❌ Erro: troca não encontrada.', components: [] });
        return;
    }

    const success = trainingService.swapPlayers(trainingMessage.id, pendingSwap.playerId, player2Id);
    trainingService.clearPendingSwap(trainingMessage.id);

    if (!success) {
        await interaction.update({ content: '❌ Erro ao trocar jogadores.', components: [] });
        return;
    }

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ Jogadores trocados!', components: [] });
}

async function handleAdicionarJogador(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const team of training.teams) {
        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel(team.name)
                .setValue(team.id.toString())
        );
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_ADICIONAR_TIME)
        .setPlaceholder('Em qual time adicionar?')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '➕ **Adicionar Jogador**\nEscolha o time:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectAdicionarTime(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const teamId = parseInt(interaction.values[0]);

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.setPendingSwap(trainingMessage.id, '', teamId);

    const modal = new ModalBuilder()
        .setCustomId(`treino_modal_adicionar_${trainingMessage.id}_${teamId}`)
        .setTitle('Adicionar Jogador');

    const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID do usuário')
        .setPlaceholder('Digite o ID do usuário (ex: 123456789)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>({ components: [userInput] });
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function handleSelectAdicionarJogador(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    await interaction.update({ content: 'Processando...', components: [] });
}

async function handleRemoverDoTime(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const team of training.teams) {
        for (const playerId of team.players) {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${team.name} - ${name}`)
                    .setValue(playerId)
            );
        }
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_REMOVER_DO_TIME)
        .setPlaceholder('Escolha um jogador para remover')
        .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '➖ **Remover Jogador**\nEscolha quem remover:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectRemoverDoTime(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const success = trainingService.removePlayerFromTeam(trainingMessage.id, playerId);

    if (!success) {
        await interaction.update({ content: '❌ Erro ao remover jogador.', components: [] });
        return;
    }

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: `✅ <@${playerId}> removido do treino!`, components: [] });
}

async function handleMoverTimes(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({ content: 'Erro ao acessar o servidor.', flags: 64 });
        return;
    }

    await interaction.deferReply({ flags: 64 });

    const result = await trainingService.moveTrainingTeamsToVoice(interaction.message.id, guild);

    await interaction.editReply({
        content: `📢 **Mover Times**\n✅ ${result.moved} jogadores movidos\n${result.failed > 0 ? `❌ ${result.failed} falharam (não estão em call)` : ''}`,
    });
}

export async function handleVencedorDynamic(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const parts = interaction.customId.split('_');
    const bracketIndex = parseInt(parts[2]);
    const teamId = parseInt(parts[3]);

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.setWinner(interaction.message.id, bracketIndex, teamId);
    await updatePartidaDisplay(interaction);
}

export async function handleSalaDynamic(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const parts = interaction.customId.split('_');
    const bracketIndex = parseInt(parts[2]);

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const bracket = training.brackets[bracketIndex];
    const currentRoom = bracket?.roomCode || '';

    const modal = new ModalBuilder()
        .setCustomId(`treino_modal_sala_${interaction.message.id}_${bracketIndex}`)
        .setTitle(`Código - Partida ${bracketIndex + 1}`);

    const roomInput = new TextInputBuilder()
        .setCustomId('room_code')
        .setLabel('Código')
        .setPlaceholder('Digite o código da partida')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(currentRoom)
        .setMaxLength(50);

    const row = new ActionRowBuilder<TextInputBuilder>({ components: [roomInput] });
    modal.addComponents(row);

    await interaction.showModal(modal);
}

export async function handleSalaModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const parts = interaction.customId.split('_');
    const messageId = parts[3];
    const bracketIndex = parseInt(parts[4]);

    const roomCode = interaction.fields.getTextInputValue('room_code');

    const training = trainingService.getTraining(messageId);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.setRoomCode(messageId, bracketIndex, roomCode);

    const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
    
    const bracketData = pendingBrackets.map((bracket) => {
        const actualIndex = training.brackets.indexOf(bracket);
        const team1 = trainingService.getTeamForBracket(training, bracket.team1);
        const team2 = trainingService.getTeamForBracket(training, bracket.team2);
        
        return {
            bracketIndex: actualIndex,
            team1Id: team1?.id || 0,
            team2Id: team2?.id || 0,
            team1Name: team1?.name || '?',
            team2Name: team2?.name || '?',
            resolved: !!bracket.winner,
            hasRoom: !!bracket.roomCode,
        };
    });

    const hasResolvedBrackets = training.brackets.some(b => b.winner !== undefined);
    const embed = TrainingEmbedBuilder.buildPartidaEmbed(training);
    const buttons = TrainingButtonBuilder.buildPartidaButtons(bracketData, hasResolvedBrackets);

    await interaction.message?.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.reply({ content: `✅ Código definido: \`${roomCode}\``, flags: 64 });
}

export async function handleAdicionarModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const parts = interaction.customId.split('_');
    const messageId = parts[3];
    const teamId = parseInt(parts[4]);

    const userId = interaction.fields.getTextInputValue('user_id');

    const training = trainingService.getTraining(messageId);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    try {
        await interaction.guild?.members.fetch(userId);
    } catch {
        await interaction.reply({ content: '❌ Usuário não encontrado no servidor.', flags: 64 });
        return;
    }

    const success = trainingService.addPlayerToTeam(messageId, userId, teamId);
    if (!success) {
        await interaction.reply({ content: '❌ Erro ao adicionar jogador.', flags: 64 });
        return;
    }

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (trainingMessage) {
        const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
        const buttons = TrainingButtonBuilder.buildSorteioButtons();

        await trainingMessage.edit({
            embeds: [embed],
            components: buttons.map(r => r.toJSON()),
        });
    }

    await interaction.reply({ content: `✅ <@${userId}> adicionado ao Time ${teamId}!`, flags: 64 });
}

async function handleProximaFase(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    await updatePartidaDisplay(interaction);
}

async function updatePartidaDisplay(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) return;

    if (training.status === 'finalizado') {
        const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
        const buttons = TrainingButtonBuilder.buildFinalizadoButtons(!!training.mvpId, training.highlights.length > 0);

        await interaction.update({
            embeds: [embed],
            components: buttons.map(r => r.toJSON()),
        });
        return;
    }

    const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
    
    const bracketData = pendingBrackets.map((bracket) => {
        const actualIndex = training.brackets.indexOf(bracket);
        const team1 = trainingService.getTeamForBracket(training, bracket.team1);
        const team2 = trainingService.getTeamForBracket(training, bracket.team2);
        
        return {
            bracketIndex: actualIndex,
            team1Id: team1?.id || 0,
            team2Id: team2?.id || 0,
            team1Name: team1?.name || '?',
            team2Name: team2?.name || '?',
            resolved: !!bracket.winner,
            hasRoom: !!bracket.roomCode,
        };
    });

    const hasResolvedBrackets = training.brackets.some(b => b.winner !== undefined);
    const embed = TrainingEmbedBuilder.buildPartidaEmbed(training);
    const buttons = TrainingButtonBuilder.buildPartidaButtons(bracketData, hasResolvedBrackets);

    await interaction.update({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleAddDestaque(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const availablePlayers = training.participants.filter(p => !training.highlights.includes(p));

    if (availablePlayers.length === 0) {
        await interaction.reply({ content: 'Todos os jogadores já são destaques!', flags: 64 });
        return;
    }

    const options = await Promise.all(
        availablePlayers.slice(0, 25).map(async (playerId) => {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            return new StringSelectMenuOptionBuilder().setLabel(name).setValue(playerId);
        })
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('treino_select_destaque')
        .setPlaceholder('Escolha um destaque')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '⭐ Escolha um jogador para adicionar como destaque:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectDestaque(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.addHighlight(trainingMessage.id, playerId);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
    const buttons = TrainingButtonBuilder.buildFinalizadoButtons(!!training.mvpId, training.highlights.length > 0);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ Destaque adicionado!', components: [] });
}

async function handleDefinirMvp(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const options = await Promise.all(
        training.participants.slice(0, 25).map(async (playerId) => {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            return new StringSelectMenuOptionBuilder().setLabel(name).setValue(playerId);
        })
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('treino_select_mvp')
        .setPlaceholder('Escolha o MVP')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '🏅 Escolha o MVP do treino:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectMvp(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    await trainingService.setMvp(trainingMessage.id, playerId, interaction.guild!, interaction.client);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
    const buttons = TrainingButtonBuilder.buildFinalizadoButtons(true, training.highlights.length > 0);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ MVP definido!', components: [] });
}

async function handleRemoverDestaque(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    if (training.highlights.length === 0) {
        await interaction.reply({ content: 'Não há destaques para remover.', flags: 64 });
        return;
    }

    const options = await Promise.all(
        training.highlights.slice(0, 25).map(async (playerId) => {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            return new StringSelectMenuOptionBuilder().setLabel(name).setValue(playerId);
        })
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_REMOVER_DESTAQUE)
        .setPlaceholder('Escolha um destaque para remover')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '➖ Escolha um destaque para remover:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectRemoverDestaque(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    trainingService.removeHighlight(trainingMessage.id, playerId);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
    const buttons = TrainingButtonBuilder.buildFinalizadoButtons(!!training.mvpId, training.highlights.length > 0);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ Destaque removido!', components: [] });
}

async function handleTrocarMvp(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const options = await Promise.all(
        training.participants.slice(0, 25).map(async (playerId) => {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(playerId);
                name = member.displayName || member.user.username;
            } catch {}
            return new StringSelectMenuOptionBuilder().setLabel(name).setValue(playerId);
        })
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('treino_select_mvp')
        .setPlaceholder('Escolha o novo MVP')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '🔄 Escolha o novo MVP:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleDesfazerVencedor(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const resolvedBrackets = trainingService.getResolvedBrackets(interaction.message.id);
    
    if (resolvedBrackets.length === 0) {
        await interaction.reply({ content: 'Não há vencedores definidos para desfazer.', flags: 64 });
        return;
    }

    const options = resolvedBrackets.map(bracket => 
        new StringSelectMenuOptionBuilder()
            .setLabel(`${bracket.phaseName} - Vencedor: ${bracket.winnerName}`)
            .setValue(bracket.bracketIndex.toString())
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TRAINING_CUSTOM_IDS.SELECT_DESFAZER_VENCEDOR)
        .setPlaceholder('Escolha qual resultado desfazer')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '↩️ **Desfazer Vencedor**\nEscolha qual resultado você quer desfazer:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleSelectDesfazerVencedor(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const bracketIndex = parseInt(interaction.values[0]);

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    const success = trainingService.clearWinner(trainingMessage.id, bracketIndex);

    if (!success) {
        await interaction.update({ content: '❌ Erro ao desfazer vencedor.', components: [] });
        return;
    }

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
    
    const bracketData = pendingBrackets.map((bracket) => {
        const actualIndex = training.brackets.indexOf(bracket);
        const team1 = trainingService.getTeamForBracket(training, bracket.team1);
        const team2 = trainingService.getTeamForBracket(training, bracket.team2);
        
        return {
            bracketIndex: actualIndex,
            team1Id: team1?.id || 0,
            team2Id: team2?.id || 0,
            team1Name: team1?.name || '?',
            team2Name: team2?.name || '?',
            resolved: !!bracket.winner,
            hasRoom: !!bracket.roomCode,
        };
    });

    const hasResolvedBrackets = training.brackets.some(b => b.winner !== undefined);
    const embed = TrainingEmbedBuilder.buildPartidaEmbed(training);
    const buttons = TrainingButtonBuilder.buildPartidaButtons(bracketData, hasResolvedBrackets);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ Vencedor desfeito!', components: [] });
}

async function handleFinalizar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', flags: 64 });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', flags: 64 });
        return;
    }

    await trainingService.finalizeTraining(interaction.message.id, interaction.guild!, interaction.client);

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);

    await interaction.update({
        embeds: [embed],
        components: [],
    });

    const channel = interaction.channel as TextChannel;
    const msg = await channel?.send({ content: '✅ Treino finalizado! Pontos distribuídos e resumo enviado.' });
    setTimeout(() => msg?.delete().catch(() => {}), 5000);
}
