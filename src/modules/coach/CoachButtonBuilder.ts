import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { COACH_CUSTOM_IDS, COACH_MESSAGES } from './constants';
import {
    GameStyle,
    TeachingStyle,
    Platform,
    Availability,
    Experience,
    GAME_STYLE_DISPLAY,
    TEACHING_STYLE_DISPLAY,
    PLATFORM_DISPLAY,
    AVAILABILITY_DISPLAY,
    EXPERIENCE_DISPLAY,
} from './types';

const SHIELD_EMOJI_ID = '1453450419929088236';

export class CoachButtonBuilder {
    static buildRequestCoachButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.REQUEST_COACH_BUTTON)
                    .setLabel(COACH_MESSAGES.REQUEST_BUTTON)
                    .setStyle(ButtonStyle.Primary),
            ],
        });
    }

    static buildFillFormButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.FILL_FORM_BUTTON)
                    .setLabel(COACH_MESSAGES.FILL_FORM_BUTTON)
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildStartFormButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.START_FORM_BUTTON)
                    .setLabel(COACH_MESSAGES.START_FORM_BUTTON)
                    .setStyle(ButtonStyle.Primary),
            ],
        });
    }

    static buildCloseTicketButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.CLOSE_TICKET_BUTTON)
                    .setLabel(COACH_MESSAGES.CLOSE_TICKET_BUTTON)
                    .setStyle(ButtonStyle.Danger),
            ],
        });
    }

    static buildAcceptRejectButtons(requestId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.ACCEPT_STUDENT}_${requestId}`)
                    .setLabel('✅ Aceitar Aluno')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.REJECT_STUDENT}_${requestId}`)
                    .setLabel('❌ Recusar')
                    .setStyle(ButtonStyle.Danger),
            ],
        });
    }

    static buildGameStyleButtons(): ActionRowBuilder<ButtonBuilder>[] {
        return [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_GAME_STYLE}agressivo`)
                        .setLabel('Agressivo')
                        .setEmoji('🔥')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_GAME_STYLE}passivo`)
                        .setLabel('Passivo')
                        .setEmoji('🛡️')
                        .setStyle(ButtonStyle.Secondary),
                ],
            }),
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_GAME_STYLE}equilibrado`)
                        .setLabel('Equilibrado')
                        .setEmoji('⚖️')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_GAME_STYLE}clutch`)
                        .setLabel('Clutch')
                        .setEmoji('🎯')
                        .setStyle(ButtonStyle.Secondary),
                ],
            }),
        ];
    }

    static buildTeachingStyleButtons(): ActionRowBuilder<ButtonBuilder>[] {
        return [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_TEACHING_STYLE}rigido`)
                        .setLabel('Rígido')
                        .setEmoji('😤')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_TEACHING_STYLE}calmo`)
                        .setLabel('Calmo')
                        .setEmoji('😌')
                        .setStyle(ButtonStyle.Secondary),
                ],
            }),
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_TEACHING_STYLE}direto`)
                        .setLabel('Direto')
                        .setEmoji('🗣️')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`${COACH_CUSTOM_IDS.BTN_TEACHING_STYLE}motivador`)
                        .setLabel('Motivador')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Secondary),
                ],
            }),
        ];
    }

    static buildPlatformButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_PLATFORM}pc`)
                    .setLabel('PC')
                    .setEmoji('🖥️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_PLATFORM}console`)
                    .setLabel('Console')
                    .setEmoji('🎮')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_PLATFORM}mobile`)
                    .setLabel('Mobile')
                    .setEmoji('📱')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildAvailabilityButtons(selectedAvailabilities: string[] = []): ActionRowBuilder<ButtonBuilder>[] {
        const availabilities = [
            { value: 'manha', label: 'Manhã', emoji: '☀️' },
            { value: 'tarde', label: 'Tarde', emoji: '🌤️' },
            { value: 'noite', label: 'Noite', emoji: '🌙' },
            { value: 'madrugada', label: 'Madrugada', emoji: '🌚' },
        ];

        const buttons = availabilities.map(avail =>
            new ButtonBuilder()
                .setCustomId(`${COACH_CUSTOM_IDS.BTN_AVAILABILITY}${avail.value}`)
                .setLabel(selectedAvailabilities.includes(avail.value) ? `✓ ${avail.label}` : avail.label)
                .setEmoji(avail.emoji)
                .setStyle(selectedAvailabilities.includes(avail.value) ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        return [
            new ActionRowBuilder<ButtonBuilder>({
                components: buttons.slice(0, 2),
            }),
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    ...buttons.slice(2),
                    new ButtonBuilder()
                        .setCustomId(COACH_CUSTOM_IDS.BTN_CONFIRM_AVAILABILITY)
                        .setLabel('Confirmar')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(selectedAvailabilities.length === 0),
                ],
            }),
        ];
    }

    static buildExperienceButtons(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_EXPERIENCE}iniciante`)
                    .setLabel('Iniciante')
                    .setEmoji('🆕')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_EXPERIENCE}intermediario`)
                    .setLabel('Intermediário')
                    .setEmoji('📈')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.BTN_EXPERIENCE}avancado`)
                    .setLabel('Avançado')
                    .setEmoji('⭐')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildGameStyleSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = (Object.entries(GAME_STYLE_DISPLAY) as [GameStyle, string][]).map(
            ([value, label]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(label.replace(/^[^\s]+\s/, ''))
                    .setDescription(this.getGameStyleDescription(value))
                    .setValue(value)
                    .setEmoji(this.getEmojiFromLabel(label))
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.SELECT_GAME_STYLE)
                    .setPlaceholder('Estilo de jogo que quer desenvolver')
                    .addOptions(options),
            ],
        });
    }

    static buildTeachingStyleSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = (Object.entries(TEACHING_STYLE_DISPLAY) as [TeachingStyle, string][]).map(
            ([value, label]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(label.replace(/^[^\s]+\s/, ''))
                    .setDescription(this.getTeachingStyleDescription(value))
                    .setValue(value)
                    .setEmoji(this.getEmojiFromLabel(label))
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.SELECT_TEACHING_STYLE)
                    .setPlaceholder('Tipo de treinador que prefere')
                    .addOptions(options),
            ],
        });
    }

    static buildPlatformSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = (Object.entries(PLATFORM_DISPLAY) as [Platform, string][]).map(
            ([value, label]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(label.replace(/^[^\s]+\s/, ''))
                    .setValue(value)
                    .setEmoji(this.getEmojiFromLabel(label))
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.SELECT_PLATFORM)
                    .setPlaceholder('Sua plataforma')
                    .addOptions(options),
            ],
        });
    }

    static buildAvailabilitySelect(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = (Object.entries(AVAILABILITY_DISPLAY) as [Availability, string][]).map(
            ([value, label]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(label.replace(/^[^\s]+\s/, ''))
                    .setValue(value)
                    .setEmoji(this.getEmojiFromLabel(label))
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.SELECT_AVAILABILITY)
                    .setPlaceholder('Sua disponibilidade')
                    .setMinValues(1)
                    .setMaxValues(4)
                    .addOptions(options),
            ],
        });
    }

    static buildExperienceSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = (Object.entries(EXPERIENCE_DISPLAY) as [Experience, string][]).map(
            ([value, label]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(label.replace(/^[^\s]+\s/, ''))
                    .setDescription(this.getExperienceDescription(value))
                    .setValue(value)
                    .setEmoji(this.getEmojiFromLabel(label))
        );

        return new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.SELECT_EXPERIENCE)
                    .setPlaceholder('Sua experiência no jogo')
                    .addOptions(options),
            ],
        });
    }

    static buildMainButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.MAIN_MODAL + '_button')
                    .setLabel('👤 Informar meu Main')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildMainModal(): ModalBuilder {
        const mainInput = new TextInputBuilder()
            .setCustomId(COACH_CUSTOM_IDS.FORM_MAIN)
            .setLabel('Qual seu personagem principal (main)?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Keilo, Saito, etc...')
            .setRequired(true)
            .setMaxLength(50);

        return new ModalBuilder()
            .setCustomId(COACH_CUSTOM_IDS.MAIN_MODAL)
            .setTitle('👤 Seu Main')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(mainInput)
            );
    }

    static buildFpsPingButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.FORM_FPS + '_button')
                    .setLabel('📊 Informar Conexão')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildFpsAndPingModal(): ModalBuilder {
        const fpsInput = new TextInputBuilder()
            .setCustomId(COACH_CUSTOM_IDS.FORM_FPS)
            .setLabel('Quantos FPS você joga?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 60, 120, 144, 240')
            .setRequired(true)
            .setMaxLength(10);

        const pingInput = new TextInputBuilder()
            .setCustomId(COACH_CUSTOM_IDS.FORM_PING)
            .setLabel('Qual seu ping médio?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 30ms, 80ms, 150ms')
            .setRequired(true)
            .setMaxLength(20);

        const conexaoInput = new TextInputBuilder()
            .setCustomId(COACH_CUSTOM_IDS.FORM_CONEXAO)
            .setLabel('Tu joga lagado? Descreve tua conexão')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Jogo de boa, sem lag / Laga bastante em x1 / Depende do horário...')
            .setRequired(true)
            .setMaxLength(200);

        return new ModalBuilder()
            .setCustomId(COACH_CUSTOM_IDS.FORM_MODAL)
            .setTitle(COACH_MESSAGES.FORM_TITLE)
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(fpsInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(pingInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(conexaoInput)
            );
    }

    static buildProfileModal(): ModalBuilder {
        const mainInput = new TextInputBuilder()
            .setCustomId(COACH_CUSTOM_IDS.PROFILE_MAIN)
            .setLabel('Qual seu personagem principal (main)?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Keilo, Saito, etc.')
            .setRequired(true)
            .setMaxLength(50);

        return new ModalBuilder()
            .setCustomId(COACH_CUSTOM_IDS.PROFILE_MODAL)
            .setTitle('⚔️ Perfil de Treinador')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(mainInput)
            );
    }

    static buildLeaveCoachButton(coachId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.LEAVE_COACH_BUTTON}${coachId}`)
                    .setLabel(COACH_MESSAGES.LEAVE_BUTTON)
                    .setEmoji({ id: SHIELD_EMOJI_ID })
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildLeaveConfirmButtons(coachId: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.LEAVE_CONFIRM_YES}${coachId}`)
                    .setLabel('Sim, quero sair')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`${COACH_CUSTOM_IDS.LEAVE_CONFIRM_NO}${coachId}`)
                    .setLabel('Não, quero ficar')
                    .setStyle(ButtonStyle.Secondary),
            ],
        });
    }

    static buildLeaveCoachGeneralButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId(COACH_CUSTOM_IDS.LEAVE_COACH_GENERAL)
                    .setLabel(COACH_MESSAGES.LEAVE_BUTTON)
                    .setEmoji({ id: SHIELD_EMOJI_ID })
                    .setStyle(ButtonStyle.Danger),
            ],
        });
    }

    private static getEmojiFromLabel(label: string): string {
        const match = label.match(/^([^\s]+)/);
        return match ? match[1] : '⚔️';
    }

    private static getGameStyleDescription(style: GameStyle): string {
        const descriptions: Record<GameStyle, string> = {
            agressivo: 'Pressão, rush, dominar o ritmo',
            passivo: 'Contra-ataque, esperar a hora certa',
            equilibrado: 'Saber adaptar conforme a partida',
            clutch: 'Especialista em x1 e pressão',
        };
        return descriptions[style];
    }

    private static getTeachingStyleDescription(style: TeachingStyle): string {
        const descriptions: Record<TeachingStyle, string> = {
            rigido: 'Cobra muito, quer perfeição',
            calmo: 'Vai no seu ritmo, paciência',
            direto: 'Fala na lata sem enrolação',
            motivador: 'Foco em incentivar',
        };
        return descriptions[style];
    }

    private static getExperienceDescription(exp: Experience): string {
        const descriptions: Record<Experience, string> = {
            iniciante: 'Menos de 1 mês jogando',
            intermediario: '1-6 meses de jogo',
            avancado: '6+ meses, quer refinar',
        };
        return descriptions[exp];
    }
}
