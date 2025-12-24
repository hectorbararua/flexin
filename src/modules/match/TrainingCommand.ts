import { 
    ActionRowBuilder,
    ApplicationCommandType, 
    ButtonInteraction,
    CacheType,
    Collection,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction
} from 'discord.js';
import { Command } from '../../core/types';
import { PermissionGuard } from '../../shared';
import { trainingService } from './TrainingService';
import { TrainingEmbedBuilder } from './TrainingEmbedBuilder';
import { TrainingButtonBuilder } from './TrainingButtonBuilder';
import { captainsRepository } from '../captains/CaptainsRepository';

export default new Command({
    name: 'iniciar',
    description: 'Inicia um treino',
    type: ApplicationCommandType.ChatInput,

    async run({ interaction }) {
        if (!PermissionGuard.canUseCommand(interaction)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                flags: 64,
            });
            return;
        }

        await interaction.deferReply();

        const training = trainingService.createTraining(interaction.id);
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
        ['treino_participar', handleParticipar],
        ['treino_sair', handleSair],
        ['treino_sortear', handleSortear],
        ['treino_voltar', handleVoltar],
        ['treino_remover_participante', handleRemoverParticipante],
        ['treino_times_2', (i) => handleTeamCount(i, 2)],
        ['treino_times_3', (i) => handleTeamCount(i, 3)],
        ['treino_times_4', (i) => handleTeamCount(i, 4)],
        ['treino_times_5', (i) => handleTeamCount(i, 5)],
        ['treino_times_6', (i) => handleTeamCount(i, 6)],
        ['treino_captain_0', (i) => handleCaptainLimit(i, 0)],
        ['treino_captain_1', (i) => handleCaptainLimit(i, 1)],
        ['treino_captain_2', (i) => handleCaptainLimit(i, 2)],
        ['treino_captain_99', (i) => handleCaptainLimit(i, 99)],
        ['treino_ressortear', handleRessortear],
        ['treino_confirmar', handleConfirmar],
        ['treino_add_destaque', handleAddDestaque],
        ['treino_definir_mvp', handleDefinirMvp],
        ['treino_finalizar', handleFinalizar],
        ['treino_proxima_fase', handleProximaFase],
    ]),

    selects: new Collection([
        ['treino_select_destaque', handleSelectDestaque],
        ['treino_select_mvp', handleSelectMvp],
        ['treino_select_remover', handleSelectRemover],
        ['treino_select_captains', handleSelectCaptains],
    ]),
});

async function handleParticipar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    const added = trainingService.addParticipant(interaction.message.id, interaction.user.id);
    if (!added) {
        await interaction.reply({ content: 'Você já está participando!', ephemeral: true });
        return;
    }

    const embed = TrainingEmbedBuilder.buildInscricaoEmbed(training);
    const buttons = TrainingButtonBuilder.buildInscricaoButtons();

    await interaction.update({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleSair(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    const removed = trainingService.removeParticipant(interaction.message.id, interaction.user.id);
    if (!removed) {
        await interaction.reply({ content: 'Você não está participando!', ephemeral: true });
        return;
    }

    const embed = TrainingEmbedBuilder.buildInscricaoEmbed(training);
    const buttons = TrainingButtonBuilder.buildInscricaoButtons();

    await interaction.update({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleSortear(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão para sortear times.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    if (training.participants.length < 4) {
        await interaction.reply({ content: '❌ Mínimo de **4 participantes** para sortear!\n(2 jogadores por time × 2 times)', ephemeral: true });
        return;
    }

    const rows = TrainingButtonBuilder.buildTeamCountButtons(training.participants.length);

    await interaction.update({
        content: `**Quantos times?** (${training.participants.length} participantes)`,
        embeds: [],
        components: rows.map(r => r.toJSON()),
    });
}

async function handleVoltar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    const embed = TrainingEmbedBuilder.buildInscricaoEmbed(training);
    const buttons = TrainingButtonBuilder.buildInscricaoButtons();

    await interaction.update({
        content: '',
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleRemoverParticipante(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    if (training.participants.length === 0) {
        await interaction.reply({ content: 'Não há participantes para remover.', ephemeral: true });
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
        .setCustomId('treino_select_remover')
        .setPlaceholder('Escolha um participante para remover')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '🗑️ Escolha um participante para remover:',
        components: [row.toJSON()],
        ephemeral: true,
    });
}

async function handleSelectRemover(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
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
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    const minPlayersNeeded = count * 2;
    const isDivisible = training.participants.length % count === 0;

    if (training.participants.length < minPlayersNeeded || !isDivisible) {
        await interaction.reply({ 
            content: `❌ Não é possível criar ${count} times equilibrados com ${training.participants.length} participantes!`, 
            ephemeral: true 
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
        components: [buttons.toJSON()],
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
        components: [buttons.toJSON()],
    });
}

async function handleRessortear(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    trainingService.shuffleTeams(interaction.message.id, training.teams.length);

    const embed = TrainingEmbedBuilder.buildSorteioEmbed(training);
    const buttons = TrainingButtonBuilder.buildSorteioButtons();

    await interaction.update({
        embeds: [embed],
        components: [buttons.toJSON()],
    });
}

async function handleConfirmar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    trainingService.confirmTeams(interaction.message.id);

    await updatePartidaDisplay(interaction);
}

export async function handleVencedorDynamic(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const parts = interaction.customId.split('_');
    const bracketIndex = parseInt(parts[2]);
    const teamId = parseInt(parts[3]);

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    trainingService.setWinner(interaction.message.id, bracketIndex, teamId);
    await updatePartidaDisplay(interaction);
}

export async function handleSalaDynamic(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const parts = interaction.customId.split('_');
    const bracketIndex = parseInt(parts[2]);

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
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
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
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

    const embed = TrainingEmbedBuilder.buildPartidaEmbed(training);
    const buttons = TrainingButtonBuilder.buildPartidaButtons(bracketData);

    await interaction.message?.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.reply({ content: `✅ Código definido: \`${roomCode}\``, flags: 64 });
}

async function handleProximaFase(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    await updatePartidaDisplay(interaction);
}

async function updatePartidaDisplay(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const training = trainingService.getTraining(interaction.message.id);
    if (!training) return;

    if (training.status === 'finalizado') {
        const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
        const buttons = TrainingButtonBuilder.buildFinalizadoButtons(!!training.mvpId);

        await interaction.update({
            embeds: [embed],
            components: buttons.map(r => r.toJSON()),
        });
        return;
    }

    const pendingBrackets = trainingService.getPendingBracketsForCurrentPhase(training);
    
    const bracketData = pendingBrackets.map((bracket, idx) => {
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

    const embed = TrainingEmbedBuilder.buildPartidaEmbed(training);
    const buttons = TrainingButtonBuilder.buildPartidaButtons(bracketData);

    await interaction.update({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });
}

async function handleAddDestaque(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    const availablePlayers = training.participants.filter(p => !training.highlights.includes(p));

    if (availablePlayers.length === 0) {
        await interaction.reply({ content: 'Todos os jogadores já são destaques!', ephemeral: true });
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
        ephemeral: true,
    });
}

async function handleSelectDestaque(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    trainingService.addHighlight(trainingMessage.id, playerId);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
    const buttons = TrainingButtonBuilder.buildFinalizadoButtons(!!training.mvpId);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ Destaque adicionado!', components: [] });
}

async function handleDefinirMvp(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
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
        ephemeral: true,
    });
}

async function handleSelectMvp(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const playerId = interaction.values[0];

    const messages = await interaction.channel?.messages.fetch({ limit: 20 });
    const trainingMessage = messages?.find(m => trainingService.getTraining(m.id));

    if (!trainingMessage) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    await trainingService.setMvp(trainingMessage.id, playerId, interaction.guild!, interaction.client);

    const training = trainingService.getTraining(trainingMessage.id);
    if (!training) return;

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);
    const buttons = TrainingButtonBuilder.buildFinalizadoButtons(true);

    await trainingMessage.edit({
        embeds: [embed],
        components: buttons.map(r => r.toJSON()),
    });

    await interaction.update({ content: '✅ MVP definido!', components: [] });
}

async function handleFinalizar(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canRemovePlayer(interaction)) {
        await interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
        return;
    }

    const training = trainingService.getTraining(interaction.message.id);
    if (!training) {
        await interaction.reply({ content: 'Treino não encontrado.', ephemeral: true });
        return;
    }

    await trainingService.finalizeTraining(interaction.message.id, interaction.guild!, interaction.client);

    const embed = TrainingEmbedBuilder.buildFinalizadoEmbed(training);

    await interaction.update({
        embeds: [embed],
        components: [],
    });

    await interaction.followUp({ content: '✅ Treino finalizado! Pontos distribuídos e resumo enviado.', ephemeral: true });
}
