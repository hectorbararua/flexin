import { 
    ActionRowBuilder,
    ApplicationCommandType, 
    ButtonInteraction,
    CacheType,
    Collection,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction
} from 'discord.js';
import { Command } from '../../core/types';
import { PermissionGuard } from '../../shared';
import { captainsRepository } from './CaptainsRepository';
import { COLORS } from '../../config';

export default new Command({
    name: 'capitaes',
    description: 'Gerenciar jogadores capitães (mais fortes)',
    type: ApplicationCommandType.ChatInput,

    async run({ interaction }) {
        if (!PermissionGuard.canUseCommand(interaction)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                flags: 64,
            });
            return;
        }

        const embed = buildCaptainsEmbed();
        const buttons = buildCaptainsButtons();

        await interaction.reply({
            embeds: [embed],
            components: [buttons.toJSON()],
        });
    },

    buttons: new Collection([
        ['captains_add', handleAdd],
        ['captains_remove', handleRemove],
    ]),

    selects: new Collection([
        ['captains_select_remove', handleSelectRemove],
    ]),

    modals: new Collection([
        ['captains_modal_add', handleModalAdd],
    ]),
});

function buildCaptainsEmbed(): EmbedBuilder {
    const captains = captainsRepository.getAll();
    const mentions = captains.map(id => `<@${id}>`);

    return new EmbedBuilder()
        .setTitle('👑 Capitães')
        .setDescription(
            mentions.length > 0
                ? `**${mentions.length} capitães:**\n\n${mentions.join('\n')}`
                : '_Nenhum capitão cadastrado_'
        )
        .setColor(COLORS.PRIMARY as `#${string}`)
        .setFooter({ text: 'Capitães são distribuídos nos times para balancear' });
}

function buildCaptainsButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId('captains_add')
                .setLabel('➕ Adicionar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('captains_remove')
                .setLabel('➖ Remover')
                .setStyle(ButtonStyle.Danger),
        ],
    });
}

async function handleAdd(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canUseCommand(interaction)) {
        await interaction.reply({ content: 'Sem permissão.', flags: 64 });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId('captains_modal_add')
        .setTitle('Adicionar Capitão');

    const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID do Usuário')
        .setPlaceholder('Cole o ID do usuário aqui')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(20);

    const row = new ActionRowBuilder<TextInputBuilder>({ components: [userIdInput] });
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function handleRemove(interaction: ButtonInteraction<CacheType>): Promise<void> {
    if (!PermissionGuard.canUseCommand(interaction)) {
        await interaction.reply({ content: 'Sem permissão.', flags: 64 });
        return;
    }

    const captains = captainsRepository.getAll();

    if (captains.length === 0) {
        await interaction.reply({ content: 'Não há capitães para remover.', flags: 64 });
        return;
    }

    const options = await Promise.all(
        captains.slice(0, 25).map(async (userId) => {
            let name = 'Desconhecido';
            try {
                const member = await interaction.guild!.members.fetch(userId);
                name = member.displayName || member.user.username;
            } catch {}
            return new StringSelectMenuOptionBuilder().setLabel(name).setValue(userId);
        })
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('captains_select_remove')
        .setPlaceholder('Escolha um jogador')
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>({ components: [selectMenu] });

    await interaction.reply({
        content: '➖ Escolha um capitão para remover:',
        components: [row.toJSON()],
        flags: 64,
    });
}

async function handleModalAdd(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    if (!/^\d{17,20}$/.test(userId)) {
        await interaction.reply({ content: '❌ ID inválido. Use apenas números (17-20 dígitos).', flags: 64 });
        return;
    }

    const captains = captainsRepository.getAll();
    if (captains.includes(userId)) {
        await interaction.reply({ content: '❌ Este usuário já é um capitão.', flags: 64 });
        return;
    }

    captainsRepository.add(userId);

    const embed = buildCaptainsEmbed();
    const buttons = buildCaptainsButtons();

    const messages = await interaction.channel?.messages.fetch({ limit: 10 });
    const panelMessage = messages?.find(m => 
        m.author.id === interaction.client.user?.id && 
        m.embeds[0]?.title === '👑 Capitães'
    );

    if (panelMessage) {
        await panelMessage.edit({ embeds: [embed], components: [buttons.toJSON()] });
    }

    await interaction.reply({ content: `✅ <@${userId}> adicionado como capitão!`, flags: 64 });
}

async function handleSelectRemove(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const userId = interaction.values[0];
    captainsRepository.remove(userId);

    const embed = buildCaptainsEmbed();
    const buttons = buildCaptainsButtons();

    const messages = await interaction.channel?.messages.fetch({ limit: 10 });
    const panelMessage = messages?.find(m => 
        m.author.id === interaction.client.user?.id && 
        m.embeds[0]?.title === '👑 Capitães'
    );

    if (panelMessage) {
        await panelMessage.edit({ embeds: [embed], components: [buttons.toJSON()] });
    }

    await interaction.update({ content: `✅ <@${userId}> removido dos capitães!`, components: [] });
}
