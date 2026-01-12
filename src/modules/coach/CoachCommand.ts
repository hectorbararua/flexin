import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    GuildMember,
    Collection,
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
} from 'discord.js';
import { Command, ComponentsButton, ComponentsSelect, ComponentsModal } from '../../core/types';
import { coachService } from './CoachService';
import { coachRepository } from './CoachRepository';
import { CoachEmbedBuilder } from './CoachEmbedBuilder';
import { CoachButtonBuilder } from './CoachButtonBuilder';
import { COACH_CUSTOM_IDS, COACH_ROLE_IDS, COACH_MESSAGES } from './constants';
import { hasAnyRole } from '../../config/roles';
import {
    CoachProfile,
    GameStyle,
    TeachingStyle,
    Platform,
    Availability,
    Experience,
} from './types';

// ============================================
// TEMPORARY PROFILE DATA
// ============================================

const profileFormData: Map<string, Partial<CoachProfile>> = new Map();

// ============================================
// BUTTON HANDLERS
// ============================================

const buttons: ComponentsButton = new Collection([
    // Botão do embed fixo
    [
        COACH_CUSTOM_IDS.REQUEST_COACH_BUTTON,
        async (interaction: ButtonInteraction) => {
            await coachService.handleRequestCoachButton(interaction);
        },
    ],
    // Botão de preencher formulário (legacy)
    [
        COACH_CUSTOM_IDS.FILL_FORM_BUTTON,
        async (interaction: ButtonInteraction) => {
            await coachService.handleFillFormButton(interaction);
        },
    ],
    // Botão de iniciar formulário
    [
        COACH_CUSTOM_IDS.START_FORM_BUTTON,
        async (interaction: ButtonInteraction) => {
            await coachService.handleStartFormButton(interaction);
        },
    ],
    // Botão de FPS/Ping
    [
        COACH_CUSTOM_IDS.FORM_FPS + '_button',
        async (interaction: ButtonInteraction) => {
            await coachService.handleFpsPingButton(interaction);
        },
    ],
    // Botão de fechar ticket
    [
        COACH_CUSTOM_IDS.CLOSE_TICKET_BUTTON,
        async (interaction: ButtonInteraction) => {
            await coachService.handleCloseTicketButton(interaction);
        },
    ],
]);

// ============================================
// SELECT HANDLERS
// ============================================

const selects: ComponentsSelect = new Collection([
    [
        COACH_CUSTOM_IDS.SELECT_GAME_STYLE,
        async (interaction: StringSelectMenuInteraction) => {
            await coachService.handleGameStyleSelect(interaction);
        },
    ],
    [
        COACH_CUSTOM_IDS.SELECT_TEACHING_STYLE,
        async (interaction: StringSelectMenuInteraction) => {
            await coachService.handleTeachingStyleSelect(interaction);
        },
    ],
    [
        COACH_CUSTOM_IDS.SELECT_PLATFORM,
        async (interaction: StringSelectMenuInteraction) => {
            await coachService.handlePlatformSelect(interaction);
        },
    ],
    [
        COACH_CUSTOM_IDS.SELECT_AVAILABILITY,
        async (interaction: StringSelectMenuInteraction) => {
            await coachService.handleAvailabilitySelect(interaction);
        },
    ],
    [
        COACH_CUSTOM_IDS.SELECT_EXPERIENCE,
        async (interaction: StringSelectMenuInteraction) => {
            await coachService.handleExperienceSelect(interaction);
        },
    ],
]);

// ============================================
// MODAL HANDLERS
// ============================================

const modals: ComponentsModal = new Collection([
    [
        COACH_CUSTOM_IDS.FORM_MODAL,
        async (interaction: ModalSubmitInteraction) => {
            await coachService.handleFormModal(interaction);
        },
    ],
    [
        COACH_CUSTOM_IDS.PROFILE_MODAL,
        async (interaction: ModalSubmitInteraction) => {
            await handleProfileModal(interaction);
        },
    ],
]);

// ============================================
// DYNAMIC HANDLERS (for IDs with params)
// ============================================

export async function handleCoachDynamicButtons(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;

    // Accept/Reject student
    if (customId.startsWith(COACH_CUSTOM_IDS.ACCEPT_STUDENT)) {
        const requestId = customId.replace(`${COACH_CUSTOM_IDS.ACCEPT_STUDENT}_`, '');
        await coachService.handleAcceptStudent(interaction, requestId);
        return;
    }

    if (customId.startsWith(COACH_CUSTOM_IDS.REJECT_STUDENT)) {
        const requestId = customId.replace(`${COACH_CUSTOM_IDS.REJECT_STUDENT}_`, '');
        await coachService.handleRejectStudent(interaction, requestId);
        return;
    }

    // Game style buttons
    if (customId.startsWith(COACH_CUSTOM_IDS.BTN_GAME_STYLE)) {
        const value = customId.replace(COACH_CUSTOM_IDS.BTN_GAME_STYLE, '') as GameStyle;
        await coachService.handleGameStyleButton(interaction, value);
        return;
    }

    // Teaching style buttons
    if (customId.startsWith(COACH_CUSTOM_IDS.BTN_TEACHING_STYLE)) {
        const value = customId.replace(COACH_CUSTOM_IDS.BTN_TEACHING_STYLE, '') as TeachingStyle;
        await coachService.handleTeachingStyleButton(interaction, value);
        return;
    }

    // Platform buttons
    if (customId.startsWith(COACH_CUSTOM_IDS.BTN_PLATFORM)) {
        const value = customId.replace(COACH_CUSTOM_IDS.BTN_PLATFORM, '') as Platform;
        await coachService.handlePlatformButton(interaction, value);
        return;
    }

    // Availability toggle buttons
    if (customId.startsWith(COACH_CUSTOM_IDS.BTN_AVAILABILITY)) {
        const value = customId.replace(COACH_CUSTOM_IDS.BTN_AVAILABILITY, '') as Availability;
        await coachService.handleAvailabilityButton(interaction, value);
        return;
    }

    // Confirm availability button
    if (customId === COACH_CUSTOM_IDS.BTN_CONFIRM_AVAILABILITY) {
        await coachService.handleConfirmAvailabilityButton(interaction);
        return;
    }

    // Experience buttons
    if (customId.startsWith(COACH_CUSTOM_IDS.BTN_EXPERIENCE)) {
        const value = customId.replace(COACH_CUSTOM_IDS.BTN_EXPERIENCE, '') as Experience;
        await coachService.handleExperienceButton(interaction, value);
        return;
    }
}

// Alias for backwards compatibility
export const handleCoachAcceptReject = handleCoachDynamicButtons;

// ============================================
// PROFILE FLOW HANDLERS
// ============================================

export async function handleProfileGameStyleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const values = interaction.values as GameStyle[];
    const data = profileFormData.get(interaction.user.id) || {};
    data.gameStyle = values; // Array de estilos
    profileFormData.set(interaction.user.id, data);

    const teachingOptions = [
        { value: 'rigido', label: 'Rígido', description: 'Cobra muito, quer perfeição', emoji: '😤' },
        { value: 'calmo', label: 'Calmo', description: 'Vai no seu ritmo, paciência', emoji: '😌' },
        { value: 'direto', label: 'Direto', description: 'Fala na lata sem enrolação', emoji: '🗣️' },
        { value: 'motivador', label: 'Motivador', description: 'Foco em incentivar', emoji: '🎉' },
    ];
    
    const options = teachingOptions.map((opt) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(opt.label)
            .setDescription(opt.description)
            .setValue(opt.value)
            .setEmoji(opt.emoji)
    );

    const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('coach_profile_teaching_select')
            .setPlaceholder('Seu jeito de ensinar')
            .addOptions(options)
    );

    await interaction.update({
        content: '**2/4** - Qual seu jeito de ensinar?',
        components: [select],
    });
}

export async function handleProfileTeachingStyleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const value = interaction.values[0] as TeachingStyle;
    const data = profileFormData.get(interaction.user.id) || {};
    data.teachingStyle = value;
    profileFormData.set(interaction.user.id, data);

    const options = [
        new StringSelectMenuOptionBuilder().setLabel('PC').setValue('pc').setEmoji('🖥️'),
        new StringSelectMenuOptionBuilder().setLabel('Console').setValue('console').setEmoji('🎮'),
        new StringSelectMenuOptionBuilder().setLabel('Mobile').setValue('mobile').setEmoji('📱'),
    ];

    const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('coach_profile_platform_select')
            .setPlaceholder('Sua plataforma')
            .addOptions(options)
    );

    await interaction.update({
        content: '**3/4** - Em qual plataforma você joga?',
        components: [select],
    });
}

export async function handleProfilePlatformSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const value = interaction.values[0] as Platform;
    const data = profileFormData.get(interaction.user.id) || {};
    data.platform = value;
    profileFormData.set(interaction.user.id, data);

    const options = [
        new StringSelectMenuOptionBuilder().setLabel('Manhã (8h - 12h)').setValue('manha').setEmoji('☀️'),
        new StringSelectMenuOptionBuilder().setLabel('Tarde (12h - 18h)').setValue('tarde').setEmoji('🌤️'),
        new StringSelectMenuOptionBuilder().setLabel('Noite (18h - 00h)').setValue('noite').setEmoji('🌙'),
        new StringSelectMenuOptionBuilder().setLabel('Madrugada (00h - 8h)').setValue('madrugada').setEmoji('🌚'),
    ];

    const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('coach_profile_availability_select')
            .setPlaceholder('Sua disponibilidade')
            .setMinValues(1)
            .setMaxValues(4)
            .addOptions(options)
    );

    await interaction.update({
        content: '**4/4** - Qual sua disponibilidade? (pode selecionar várias)',
        components: [select],
    });
}

export async function handleProfileAvailabilitySelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const values = interaction.values as Availability[];
    const data = profileFormData.get(interaction.user.id) || {};
    data.availability = values;
    profileFormData.set(interaction.user.id, data);

    // Abrir modal para main
    const modal = CoachButtonBuilder.buildProfileModal();
    await interaction.showModal(modal);
}

async function handleProfileModal(interaction: ModalSubmitInteraction): Promise<void> {
    try {
        await interaction.deferReply({ flags: 64 });

        const main = interaction.fields.getTextInputValue(COACH_CUSTOM_IDS.PROFILE_MAIN);
        const data = profileFormData.get(interaction.user.id);

        if (!data || !data.gameStyle || !data.teachingStyle || !data.platform || !data.availability) {
            await interaction.editReply({ content: '❌ Erro: dados do formulário não encontrados. Tente novamente.' });
            return;
        }

        const profile: CoachProfile = {
            gameStyle: data.gameStyle as GameStyle[],
            teachingStyle: data.teachingStyle,
            main: main,
            platform: data.platform,
            availability: data.availability,
        };

        const success = await coachService.updateCoachProfile(interaction.user.id, profile);

        profileFormData.delete(interaction.user.id);

        if (success) {
            await interaction.editReply({ content: COACH_MESSAGES.SUCCESS_PROFILE_UPDATED });
            // Enviar/atualizar embed no canal de exibição
            await coachService.updateCoachDisplayEmbed(interaction.client, interaction.user.id);
        } else {
            await interaction.editReply({ content: '❌ Erro ao atualizar perfil.' });
        }
    } catch (error) {
        console.error('[CoachCommand] Erro ao processar modal de perfil:', error);
        await interaction.editReply({ content: '❌ Erro ao processar perfil.' }).catch(() => { });
    }
}

// ============================================
// COMMAND
// ============================================

export default new Command({
    name: 'treinador',
    description: 'Gerenciar sistema de treinadores da AUGE',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'adicionar',
            description: 'Adicionar um novo treinador',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'usuario',
                    description: 'Usuário que será treinador',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'remover',
            description: 'Remover um treinador do sistema',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'usuario',
                    description: 'Treinador a ser removido',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'lista',
            description: 'Listar todos os treinadores',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'perfil',
            description: 'Configurar seu perfil de treinador',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'alunos',
            description: 'Ver seus alunos',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'remover-aluno',
            description: 'Remover um aluno da sua lista',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'usuario',
                    description: 'Aluno a ser removido',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
    ],
    buttons,
    selects,
    modals,

    async run({ interaction, options }) {
        const subcommand = options.getSubcommand();
        const member = interaction.member as GuildMember;
        const guild = interaction.guild;

        if (!guild) {
            await interaction.reply({ content: '❌ Comando só pode ser usado em servidor.', flags: 64 });
            return;
        }

        // Verificar permissões para comandos de staff
        const staffCommands = ['adicionar', 'remover'];
        if (staffCommands.includes(subcommand)) {
            if (!hasAnyRole(member.roles.cache, [COACH_ROLE_IDS.STAFF])) {
                await interaction.reply({ content: COACH_MESSAGES.ERROR_NOT_STAFF, flags: 64 });
                return;
            }
        }

        // Verificar se é treinador para comandos de treinador
        const coachCommands = ['perfil', 'alunos', 'remover-aluno'];
        if (coachCommands.includes(subcommand)) {
            if (!coachRepository.isCoach(interaction.user.id)) {
                await interaction.reply({ content: COACH_MESSAGES.ERROR_NOT_COACH, flags: 64 });
                return;
            }
        }

        switch (subcommand) {
            case 'adicionar':
                await handleAdicionarSubcommand(interaction, options, guild);
                break;
            case 'remover':
                await handleRemoverSubcommand(interaction, options, guild);
                break;
            case 'lista':
                await handleListaSubcommand(interaction);
                break;
            case 'perfil':
                await handlePerfilSubcommand(interaction);
                break;
            case 'alunos':
                await handleAlunosSubcommand(interaction);
                break;
            case 'remover-aluno':
                await handleRemoverAlunoSubcommand(interaction, options, guild);
                break;
        }
    },
});

// ============================================
// SUBCOMMAND HANDLERS
// ============================================

async function handleAdicionarSubcommand(
    interaction: any,
    options: any,
    guild: any
): Promise<void> {
    await interaction.deferReply({ flags: 64 });

    const user = options.getUser('usuario');
    if (!user) {
        await interaction.editReply({ content: '❌ Usuário não encontrado.' });
        return;
    }

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
        await interaction.editReply({ content: '❌ Membro não encontrado no servidor.' });
        return;
    }

    const result = await coachService.addCoach(guild, member, interaction.user.id);

    if (!result.success) {
        await interaction.editReply({ content: result.error });
        return;
    }

    const message = COACH_MESSAGES.SUCCESS_COACH_ADDED
        .replace('{user}', user.toString())
        .replace('{channel}', `<#${result.channel?.id}>`)
        .replace('{role}', `<@&${result.role?.id}>`);

    await interaction.editReply({ content: message });
}

async function handleRemoverSubcommand(
    interaction: any,
    options: any,
    guild: any
): Promise<void> {
    await interaction.deferReply({ flags: 64 });

    const user = options.getUser('usuario');
    if (!user) {
        await interaction.editReply({ content: '❌ Usuário não encontrado.' });
        return;
    }

    const result = await coachService.removeCoach(guild, user.id, interaction.client);

    if (!result.success) {
        await interaction.editReply({ content: result.error });
        return;
    }

    const message = COACH_MESSAGES.SUCCESS_COACH_REMOVED.replace('{user}', user.toString());
    await interaction.editReply({ content: message });
}

async function handleListaSubcommand(interaction: any): Promise<void> {
    await interaction.deferReply({ flags: 64 });

    const coaches = coachService.getAllCoaches();
    const embed = CoachEmbedBuilder.buildCoachListEmbed(coaches);

    await interaction.editReply({ embeds: [embed] });
}

async function handlePerfilSubcommand(interaction: any): Promise<void> {
    // Iniciar fluxo de selects para perfil
    profileFormData.set(interaction.user.id, {});

    const options = [
        new StringSelectMenuOptionBuilder().setLabel('Agressivo').setDescription('Pressão, rush, dominar o ritmo').setValue('agressivo').setEmoji('🔥'),
        new StringSelectMenuOptionBuilder().setLabel('Passivo').setDescription('Contra-ataque, esperar a hora certa').setValue('passivo').setEmoji('🛡️'),
        new StringSelectMenuOptionBuilder().setLabel('Equilibrado').setDescription('Saber adaptar conforme a partida').setValue('equilibrado').setEmoji('⚖️'),
        new StringSelectMenuOptionBuilder().setLabel('Clutch').setDescription('Especialista em x1 e pressão').setValue('clutch').setEmoji('🎯'),
    ];

    const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('coach_profile_game_style_select')
            .setPlaceholder('Seus estilos de jogo (pode selecionar vários)')
            .setMinValues(1)
            .setMaxValues(4)
            .addOptions(options)
    );

    await interaction.reply({
        content: '**1/4** - Quais seus estilos de jogo? (pode selecionar mais de um)',
        components: [select],
        flags: 64,
    });
}

async function handleAlunosSubcommand(interaction: any): Promise<void> {
    await interaction.deferReply({ flags: 64 });

    const coach = coachService.getCoach(interaction.user.id);
    if (!coach) {
        await interaction.editReply({ content: COACH_MESSAGES.ERROR_COACH_NOT_FOUND });
        return;
    }

    const embed = CoachEmbedBuilder.buildStudentListEmbed(coach);
    await interaction.editReply({ embeds: [embed] });
}

async function handleRemoverAlunoSubcommand(
    interaction: any,
    options: any,
    guild: any
): Promise<void> {
    await interaction.deferReply({ flags: 64 });

    const user = options.getUser('usuario');
    if (!user) {
        await interaction.editReply({ content: '❌ Usuário não encontrado.' });
        return;
    }

    const result = await coachService.removeStudent(guild, interaction.user.id, user.id, interaction.client);

    if (!result.success) {
        await interaction.editReply({ content: result.error });
        return;
    }

    const message = COACH_MESSAGES.SUCCESS_STUDENT_REMOVED.replace('{user}', user.toString());
    await interaction.editReply({ content: message });
}

