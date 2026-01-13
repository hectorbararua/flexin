import {
    Client,
    Guild,
    GuildMember,
    TextChannel,
    CategoryChannel,
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    ChannelType,
    PermissionFlagsBits,
    Role,
} from 'discord.js';
import { coachRepository } from './CoachRepository';
import { CoachEmbedBuilder } from './CoachEmbedBuilder';
import { CoachButtonBuilder } from './CoachButtonBuilder';
import { COACH_CHANNEL_IDS, COACH_ROLE_IDS, COACH_CUSTOM_IDS, COACH_MESSAGES } from './constants';
import {
    Coach,
    StudentRequest,
    StudentPreferences,
    CoachProfile,
    GameStyle,
    TeachingStyle,
    Platform,
    Availability,
    Experience,
    extractUserInfo,
    generateRequestId,
} from './types';
import { ChannelUtils } from '../../shared/utils';
import { feedbackRepository, FeedbackButtonBuilder } from '../feedback';

export class CoachService {
    private formData: Map<string, Partial<StudentPreferences>> = new Map();

    async sendSetupEmbed(channel: TextChannel): Promise<boolean> {
        try {
            const embed = CoachEmbedBuilder.buildRequestCoachEmbed();
            const button = CoachButtonBuilder.buildRequestCoachButton();

            await channel.send({ embeds: [embed], components: [button] });
            return true;
        } catch {
            return false;
        }
    }

    async initSetupEmbed(client: Client): Promise<void> {
        try {
            const channel = await ChannelUtils.getTextChannel(client, COACH_CHANNEL_IDS.EMBED_CHANNEL);
            if (!channel) return;

            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessage = messages.find(
                msg => msg.author.id === client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.components.length > 0
            );

            if (botMessage) return;
            await this.sendSetupEmbed(channel);
        } catch { }
    }

    async sendLeaveCoachEmbed(channel: TextChannel): Promise<boolean> {
        try {
            const embed = CoachEmbedBuilder.buildLeaveCoachChannelEmbed();
            const button = CoachButtonBuilder.buildLeaveCoachGeneralButton();

            await channel.send({ embeds: [embed], components: [button] });
            return true;
        } catch {
            return false;
        }
    }

    async initLeaveCoachEmbed(client: Client): Promise<void> {
        try {
            const channel = await ChannelUtils.getTextChannel(client, COACH_CHANNEL_IDS.LEAVE_COACH_CHANNEL);
            if (!channel) return;

            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessage = messages.find(
                msg => msg.author.id === client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.components.length > 0
            );

            if (botMessage) return;
            await this.sendLeaveCoachEmbed(channel);
        } catch { }
    }

    async addCoach(guild: Guild, user: GuildMember, addedBy: string): Promise<{ success: boolean; error?: string; coach?: Coach; role?: Role; channel?: TextChannel }> {
        try {
            if (coachRepository.isCoach(user.id)) {
                return { success: false, error: COACH_MESSAGES.ERROR_ALREADY_COACH };
            }

            const coachRole = await guild.roles.fetch(COACH_ROLE_IDS.COACH);
            if (coachRole) {
                await user.roles.add(coachRole).catch(() => { });
            }

            const roleName = `Aprendiz - ${user.displayName}`;
            let apprenticeRole = guild.roles.cache.find(r => r.name === roleName);

            if (!apprenticeRole) {
                const colors = ['#9B59B6', '#E91E63', '#3498DB', '#2ECC71', '#F39C12', '#1ABC9C', '#E74C3C', '#9C27B0', '#00BCD4', '#FF5722'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                apprenticeRole = await guild.roles.create({
                    name: roleName,
                    color: randomColor as `#${string}`,
                    reason: `Cargo de aprendiz para treinador ${user.displayName}`,
                });
            }

            const category = await guild.channels.fetch(COACH_CHANNEL_IDS.TRAINING_CATEGORY) as CategoryChannel;
            const channelName = `treino-${user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            let trainingChannel = guild.channels.cache.find(
                ch => ch.name === channelName && ch.parentId === category?.id
            ) as TextChannel | undefined;

            if (!trainingChannel) {
                trainingChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category?.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
                        { id: apprenticeRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    ],
                    reason: `Canal de treino para ${user.displayName}`,
                });

                const welcomeEmbed = CoachEmbedBuilder.buildTrainingChannelEmbed({ id: user.id } as Coach, 'Nenhum aluno ainda');
                const leaveButton = CoachButtonBuilder.buildLeaveCoachButton(user.id);
                await trainingChannel.send({ embeds: [welcomeEmbed], components: [leaveButton] });
            } else {
                await trainingChannel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ManageMessages: true }).catch(() => { });
                await trainingChannel.permissionOverwrites.edit(apprenticeRole.id, { ViewChannel: true, SendMessages: true }).catch(() => { });
            }

            const coach: Coach = {
                id: user.id,
                odUserId: user.id,
                username: user.user.username,
                displayName: user.displayName,
                roleId: apprenticeRole.id,
                channelId: trainingChannel.id,
                studentIds: [],
                createdAt: new Date().toISOString(),
                createdBy: addedBy,
            };

            await coachRepository.createCoach(coach);
            return { success: true, coach, role: apprenticeRole, channel: trainingChannel };
        } catch {
            return { success: false, error: 'Erro ao adicionar treinador.' };
        }
    }

    async removeCoach(guild: Guild, userId: string, client?: Client): Promise<{ success: boolean; error?: string }> {
        try {
            const coach = coachRepository.getCoach(userId);
            if (!coach) {
                return { success: false, error: COACH_MESSAGES.ERROR_COACH_NOT_FOUND };
            }

            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                const coachRole = await guild.roles.fetch(COACH_ROLE_IDS.COACH);
                if (coachRole) {
                    await member.roles.remove(coachRole).catch(() => { });
                }
            }

            if (coach.roleId) {
                const apprenticeRole = await guild.roles.fetch(coach.roleId).catch(() => null);
                if (apprenticeRole) {
                    await apprenticeRole.delete().catch(() => { });
                }
            }

            if (coach.channelId) {
                const trainingChannel = await guild.channels.fetch(coach.channelId).catch(() => null);
                if (trainingChannel) {
                    await trainingChannel.delete().catch(() => { });
                }
            }

            if (client) {
                await this.removeCoachDisplayEmbed(client, coach);
            }

            await coachRepository.deleteCoach(userId);
            return { success: true };
        } catch {
            return { success: false, error: 'Erro ao remover treinador.' };
        }
    }

    private async removeCoachDisplayEmbed(client: Client, coach: Coach): Promise<void> {
        try {
            const displayChannel = await ChannelUtils.getTextChannel(client, COACH_CHANNEL_IDS.COACHES_DISPLAY_CHANNEL);
            if (!displayChannel) return;

            const messages = await displayChannel.messages.fetch({ limit: 100 });
            const coachMessage = messages.find(
                msg => msg.author.id === client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.embeds[0].title?.includes(coach.displayName)
            );

            if (coachMessage) {
                await coachMessage.delete().catch(() => { });
            }
        } catch { }
    }

    async updateCoachProfile(userId: string, profile: CoachProfile): Promise<boolean> {
        return coachRepository.updateCoachProfile(userId, profile);
    }

    getCoach(userId: string): Coach | undefined {
        return coachRepository.getCoach(userId);
    }

    getAllCoaches(): Coach[] {
        return coachRepository.getAllCoaches();
    }

    isCoach(userId: string): boolean {
        return coachRepository.isCoach(userId);
    }

    async updateCoachDisplayEmbed(client: Client, coachId: string): Promise<void> {
        try {
            const coach = coachRepository.getCoach(coachId);
            if (!coach || !coach.profile) return;

            const displayChannel = await ChannelUtils.getTextChannel(client, COACH_CHANNEL_IDS.COACHES_DISPLAY_CHANNEL);
            if (!displayChannel) return;

            let avatarUrl: string | undefined;
            try {
                const user = await client.users.fetch(coachId);
                avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
            } catch { }

            const feedbackStats = feedbackRepository.getCoachFeedbackStats(coachId);

            const messages = await displayChannel.messages.fetch({ limit: 100 });
            const existingMessage = messages.find(
                msg => msg.author.id === client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.embeds[0].title?.includes(coach.displayName)
            );

            const embed = CoachEmbedBuilder.buildCoachDisplayEmbed(coach, avatarUrl, feedbackStats);
            const avaliarButton = FeedbackButtonBuilder.buildAvaliarButton(coachId);

            if (existingMessage) {
                await existingMessage.edit({ embeds: [embed], components: [avaliarButton] });
            } else {
                await displayChannel.send({ embeds: [embed], components: [avaliarButton] });
            }
        } catch { }
    }

    async initCoachDisplayEmbeds(client: Client): Promise<void> {
        try {
            const coaches = coachRepository.getAllCoaches();
            const coachesWithProfile = coaches.filter(c => c.profile);

            for (const coach of coachesWithProfile) {
                await this.updateCoachDisplayEmbed(client, coach.id);
            }
        } catch { }
    }

    async handleRequestCoachButton(interaction: ButtonInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply({ content: '❌ Erro ao processar solicitação.' });
                return;
            }

            const existingRequest = coachRepository.getRequestByUserId(interaction.user.id);
            if (existingRequest) {
                await interaction.editReply({ content: '❌ Você já possui uma solicitação pendente. Aguarde ser aceito por um treinador.' });
                return;
            }

            const currentCoach = coachRepository.getCoachByStudent(interaction.user.id);
            if (currentCoach) {
                await interaction.editReply({ content: `❌ Você já é aluno de <@${currentCoach.id}>. Peça para ele te remover primeiro se quiser trocar de treinador.` });
                return;
            }

            const ticketBaseChannel = await guild.channels.fetch(COACH_CHANNEL_IDS.EMBED_CHANNEL) as TextChannel;
            if (!ticketBaseChannel) {
                await interaction.editReply({ content: '❌ Canal de tickets não encontrado.' });
                return;
            }

            const ticketName = `Treino de ${interaction.user.displayName || interaction.user.username}`;

            const ticketThread = await ticketBaseChannel.threads.create({
                name: ticketName,
                autoArchiveDuration: 10080,
                type: ChannelType.PrivateThread,
                invitable: false,
                reason: `Ticket de treinamento para ${interaction.user.username}`,
            });

            await ticketThread.members.add(interaction.user.id);

            const staffRole = guild.roles.cache.get(COACH_ROLE_IDS.STAFF);
            const coachRole = guild.roles.cache.get(COACH_ROLE_IDS.COACH);

            if (staffRole) {
                for (const [, member] of staffRole.members) {
                    await ticketThread.members.add(member.id).catch(() => { });
                }
            }

            if (coachRole) {
                for (const [, member] of coachRole.members) {
                    await ticketThread.members.add(member.id).catch(() => { });
                }
            }

            const userInfo = extractUserInfo(interaction.user);
            const requestId = generateRequestId();
            const request: StudentRequest = {
                id: requestId,
                odUserId: userInfo.id,
                username: userInfo.username,
                displayName: userInfo.displayName,
                avatarUrl: userInfo.avatarUrl,
                preferences: {
                    gameStyle: 'equilibrado',
                    teachingStyle: 'calmo',
                    platform: 'pc',
                    fps: '',
                    ping: '',
                    availability: [],
                    experience: 'iniciante',
                    main: '',
                    conexaoInfo: '',
                },
                ticketChannelId: ticketThread.id,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            await coachRepository.createRequest(request);

            const welcomeEmbed = CoachEmbedBuilder.buildTicketWelcomeEmbed(interaction.user.username);
            const startButton = CoachButtonBuilder.buildStartFormButton();

            await ticketThread.send({
                content: `<@${interaction.user.id}>`,
                embeds: [welcomeEmbed],
                components: [startButton],
            });

            await interaction.editReply({ content: `✅ Ticket criado! Vá para ${ticketThread} para preencher o formulário.` });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao criar ticket.' }).catch(() => { });
        }
    }

    async handleFillFormButton(interaction: ButtonInteraction): Promise<void> {
        await this.handleStartFormButton(interaction);
    }

    async handleStartFormButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const channel = interaction.channel as TextChannel;
            if (!channel) {
                await interaction.reply({ content: '❌ Canal não encontrado.', flags: 64 });
                return;
            }

            await interaction.update({ components: [] });

            this.formData.set(interaction.user.id, {});

            const gameStyleButtons = CoachButtonBuilder.buildGameStyleButtons();
            await channel.send({ content: COACH_MESSAGES.CONV_GAME_STYLE, components: gameStyleButtons });
        } catch {
            await interaction.reply({ content: '❌ Erro ao iniciar formulário.', flags: 64 }).catch(() => { });
        }
    }

    async handleGameStyleButton(interaction: ButtonInteraction, value: GameStyle): Promise<void> {
        try {
            const channel = interaction.channel as TextChannel;
            if (!channel) return;

            const data = this.formData.get(interaction.user.id) || {};
            data.gameStyle = value;
            this.formData.set(interaction.user.id, data);

            const { GAME_STYLE_DISPLAY } = await import('./types');
            await interaction.update({
                content: `${COACH_MESSAGES.CONV_GAME_STYLE}\n\n✅ **Resposta:** ${GAME_STYLE_DISPLAY[value]}`,
                components: [],
            });

            const teachingStyleButtons = CoachButtonBuilder.buildTeachingStyleButtons();
            await channel.send({ content: COACH_MESSAGES.CONV_TEACHING_STYLE, components: teachingStyleButtons });
        } catch { }
    }

    async handleTeachingStyleButton(interaction: ButtonInteraction, value: TeachingStyle): Promise<void> {
        try {
            const channel = interaction.channel as TextChannel;
            if (!channel) return;

            const data = this.formData.get(interaction.user.id) || {};
            data.teachingStyle = value;
            this.formData.set(interaction.user.id, data);

            const { TEACHING_STYLE_DISPLAY } = await import('./types');
            await interaction.update({
                content: `${COACH_MESSAGES.CONV_TEACHING_STYLE}\n\n✅ **Resposta:** ${TEACHING_STYLE_DISPLAY[value]}`,
                components: [],
            });

            const platformButtons = CoachButtonBuilder.buildPlatformButtons();
            await channel.send({ content: COACH_MESSAGES.CONV_PLATFORM, components: [platformButtons] });
        } catch { }
    }

    async handlePlatformButton(interaction: ButtonInteraction, value: Platform): Promise<void> {
        try {
            const channel = interaction.channel as TextChannel;
            if (!channel) return;

            const data = this.formData.get(interaction.user.id) || {};
            data.platform = value;
            data.availability = [];
            this.formData.set(interaction.user.id, data);

            const { PLATFORM_DISPLAY } = await import('./types');
            await interaction.update({
                content: `${COACH_MESSAGES.CONV_PLATFORM}\n\n✅ **Resposta:** ${PLATFORM_DISPLAY[value]}`,
                components: [],
            });

            const availabilityButtons = CoachButtonBuilder.buildAvailabilityButtons([]);
            await channel.send({ content: COACH_MESSAGES.CONV_AVAILABILITY, components: availabilityButtons });
        } catch { }
    }

    async handleAvailabilityButton(interaction: ButtonInteraction, value: Availability): Promise<void> {
        try {
            const data = this.formData.get(interaction.user.id) || {};
            const currentAvailabilities = (data.availability as Availability[]) || [];

            if (currentAvailabilities.includes(value)) {
                data.availability = currentAvailabilities.filter(a => a !== value);
            } else {
                data.availability = [...currentAvailabilities, value];
            }
            this.formData.set(interaction.user.id, data);

            const availabilityButtons = CoachButtonBuilder.buildAvailabilityButtons(data.availability as string[]);
            await interaction.update({ components: availabilityButtons });
        } catch { }
    }

    async handleConfirmAvailabilityButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const channel = interaction.channel as TextChannel;
            if (!channel) return;

            const data = this.formData.get(interaction.user.id);
            if (!data || !data.availability || data.availability.length === 0) {
                await interaction.reply({ content: '❌ Selecione pelo menos uma disponibilidade!', flags: 64 });
                return;
            }

            const { AVAILABILITY_DISPLAY } = await import('./types');
            const displayValues = (data.availability as Availability[]).map(v => AVAILABILITY_DISPLAY[v]).join(', ');
            await interaction.update({
                content: `${COACH_MESSAGES.CONV_AVAILABILITY}\n\n✅ **Resposta:** ${displayValues}`,
                components: [],
            });

            const experienceButtons = CoachButtonBuilder.buildExperienceButtons();
            await channel.send({ content: COACH_MESSAGES.CONV_EXPERIENCE, components: [experienceButtons] });
        } catch { }
    }

    async handleExperienceButton(interaction: ButtonInteraction, value: Experience): Promise<void> {
        try {
            const data = this.formData.get(interaction.user.id) || {};
            data.experience = value;
            this.formData.set(interaction.user.id, data);

            const { EXPERIENCE_DISPLAY } = await import('./types');
            await interaction.update({
                content: `${COACH_MESSAGES.CONV_EXPERIENCE}\n\n✅ **Resposta:** ${EXPERIENCE_DISPLAY[value]}`,
                components: [],
            });

            const channel = interaction.channel as TextChannel;
            if (channel) {
                await channel.send({
                    content: COACH_MESSAGES.CONV_MAIN_CHARACTER,
                    components: [CoachButtonBuilder.buildMainButton()],
                });
            }
        } catch { }
    }

    async handleMainButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const modal = CoachButtonBuilder.buildMainModal();
            await interaction.showModal(modal);
        } catch { }
    }

    async handleMainModal(interaction: ModalSubmitInteraction): Promise<void> {
        try {
            await interaction.deferUpdate().catch(() => { });

            const main = interaction.fields.getTextInputValue(COACH_CUSTOM_IDS.FORM_MAIN);

            const data = this.formData.get(interaction.user.id) || {};
            data.main = main;
            this.formData.set(interaction.user.id, data);

            const channel = interaction.channel as TextChannel;
            if (channel) {
                await channel.send({ content: `✅ **Main informado:** ${main}` });
                await channel.send({
                    content: COACH_MESSAGES.CONV_FPS_PING,
                    components: [CoachButtonBuilder.buildFpsPingButton()],
                });
            }
        } catch { }
    }

    async handleGameStyleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const value = interaction.values[0] as GameStyle;
        await this.handleGameStyleButton(interaction as unknown as ButtonInteraction, value);
    }

    async handleTeachingStyleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const value = interaction.values[0] as TeachingStyle;
        await this.handleTeachingStyleButton(interaction as unknown as ButtonInteraction, value);
    }

    async handlePlatformSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const value = interaction.values[0] as Platform;
        await this.handlePlatformButton(interaction as unknown as ButtonInteraction, value);
    }

    async handleAvailabilitySelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const values = interaction.values as Availability[];
        const data = this.formData.get(interaction.user.id) || {};
        data.availability = values;
        this.formData.set(interaction.user.id, data);
        await this.handleConfirmAvailabilityButton(interaction as unknown as ButtonInteraction);
    }

    async handleExperienceSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const value = interaction.values[0] as Experience;
        await this.handleExperienceButton(interaction as unknown as ButtonInteraction, value);
    }

    async handleFpsPingButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const modal = CoachButtonBuilder.buildFpsAndPingModal();
            await interaction.showModal(modal);
        } catch { }
    }

    async handleFormModal(interaction: ModalSubmitInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const fps = interaction.fields.getTextInputValue(COACH_CUSTOM_IDS.FORM_FPS);
            const ping = interaction.fields.getTextInputValue(COACH_CUSTOM_IDS.FORM_PING);
            const conexaoInfo = interaction.fields.getTextInputValue(COACH_CUSTOM_IDS.FORM_CONEXAO);

            const data = this.formData.get(interaction.user.id);
            if (!data) {
                await interaction.editReply({ content: '❌ Erro: dados do formulário não encontrados. Tente novamente.' });
                return;
            }

            data.fps = fps;
            data.ping = ping;
            data.conexaoInfo = conexaoInfo;

            if (!interaction.channelId) {
                await interaction.editReply({ content: '❌ Erro: canal não encontrado.' });
                return;
            }
            const request = coachRepository.getRequestByTicketChannelId(interaction.channelId);
            if (!request) {
                await interaction.editReply({ content: '❌ Erro: solicitação não encontrada.' });
                return;
            }

            const preferences: StudentPreferences = {
                gameStyle: data.gameStyle || 'equilibrado',
                teachingStyle: data.teachingStyle || 'calmo',
                platform: data.platform || 'pc',
                fps: data.fps || 'N/A',
                ping: data.ping || 'N/A',
                availability: data.availability || [],
                experience: data.experience || 'iniciante',
                main: data.main || 'N/A',
                conexaoInfo: data.conexaoInfo || 'N/A',
            };

            request.preferences = preferences;
            await coachRepository.updateRequest(request.id, { preferences });

            this.formData.delete(interaction.user.id);

            await interaction.editReply({ content: '✅ **Formulário enviado!**' });

            const channel = interaction.channel as TextChannel;
            if (channel) {
                const submittedEmbed = CoachEmbedBuilder.buildFormSubmittedEmbed(request);
                const closeButton = CoachButtonBuilder.buildCloseTicketButton();

                await channel.send({
                    content: `<@${interaction.user.id}>`,
                    embeds: [submittedEmbed],
                    components: [closeButton],
                });
            }

            await this.sendRequestToCoaches(interaction.client, request);
        } catch {
            await interaction.editReply({ content: '❌ Erro ao processar formulário.' }).catch(() => { });
        }
    }

    private async sendRequestToCoaches(client: Client, request: StudentRequest): Promise<void> {
        try {
            const requestsChannel = await ChannelUtils.getTextChannel(client, COACH_CHANNEL_IDS.REQUESTS_CHANNEL);
            if (!requestsChannel) return;

            const requestEmbed = CoachEmbedBuilder.buildRequestEmbed(request);
            const buttons = CoachButtonBuilder.buildAcceptRejectButtons(request.id);

            const message = await requestsChannel.send({ embeds: [requestEmbed], components: [buttons] });
            await coachRepository.setRequestMessageId(request.id, message.id);
        } catch { }
    }

    async handleCloseTicketButton(interaction: ButtonInteraction): Promise<void> {
        try {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild;

            if (!guild || !member) {
                await interaction.reply({ content: '❌ Erro ao processar.', flags: 64 });
                return;
            }

            const hasStaffRole = member.roles.cache.has(COACH_ROLE_IDS.STAFF);
            const hasCoachRole = member.roles.cache.has(COACH_ROLE_IDS.COACH);

            if (!hasStaffRole && !hasCoachRole) {
                await interaction.reply({ content: '❌ Apenas **Staff** ou **Treinadores** podem finalizar o ticket.', flags: 64 });
                return;
            }

            await interaction.deferReply();

            const channel = interaction.channel;

            await interaction.editReply({
                content: `🔒 **Ticket finalizado por** <@${interaction.user.id}>!\n\n*Esta thread será excluída em 3 segundos...*`,
            });

            await new Promise(resolve => setTimeout(resolve, 3000));

            if (channel?.isThread()) {
                await channel.delete(`Ticket finalizado por ${interaction.user.username}`).catch(() => { });
            } else {
                await (channel as TextChannel)?.delete(`Ticket finalizado por ${interaction.user.username}`).catch(() => { });
            }
        } catch {
            await interaction.reply({ content: '❌ Erro ao fechar ticket.', flags: 64 }).catch(() => { });
        }
    }

    async handleAcceptStudent(interaction: ButtonInteraction, requestId: string): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply({ content: '❌ Erro ao processar.' });
                return;
            }

            const coach = coachRepository.getCoach(interaction.user.id);
            if (!coach) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_NOT_COACH });
                return;
            }

            const request = coachRepository.getRequest(requestId);
            if (!request) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_REQUEST_NOT_FOUND });
                return;
            }

            if (request.status !== 'pending') {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_ALREADY_ACCEPTED });
                return;
            }

            const member = await guild.members.fetch(request.odUserId).catch(() => null);
            if (member) {
                const apprenticeRole = await guild.roles.fetch(coach.roleId);
                if (apprenticeRole) {
                    await member.roles.add(apprenticeRole).catch(() => { });
                }
            }

            await coachRepository.addStudent(coach.id, request.odUserId);
            await coachRepository.updateRequestStatus(requestId, 'accepted', coach.id);

            const acceptedEmbed = CoachEmbedBuilder.buildRequestAcceptedEmbed(request, coach);
            await interaction.message.edit({ embeds: [acceptedEmbed], components: [] }).catch(() => { });

            await this.updateTrainingChannelWelcome(interaction.client, coach);

            const ticketChannel = await ChannelUtils.getTextChannel(interaction.client, request.ticketChannelId);
            if (ticketChannel) {
                const message = COACH_MESSAGES.STUDENT_ACCEPTED.replace('{coach}', `<@${coach.id}>`);
                await ticketChannel.send({ content: message });
            }

            try {
                const user = await interaction.client.users.fetch(request.odUserId);
                const dmMessage = COACH_MESSAGES.STUDENT_ACCEPTED.replace('{coach}', `<@${coach.id}>`);
                await user.send({ content: dmMessage });
            } catch { }

            await interaction.editReply({ content: `✅ Você aceitou <@${request.odUserId}> como seu aluno!` });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao aceitar aluno.' }).catch(() => { });
        }
    }

    async handleRejectStudent(interaction: ButtonInteraction, requestId: string): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            if (!coachRepository.isCoach(interaction.user.id)) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_NOT_COACH });
                return;
            }

            const request = coachRepository.getRequest(requestId);
            if (!request) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_REQUEST_NOT_FOUND });
                return;
            }

            await interaction.editReply({ content: `✅ Você recusou a solicitação de <@${request.odUserId}>.` });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao recusar.' }).catch(() => { });
        }
    }

    async removeStudent(guild: Guild, coachId: string, studentId: string, client?: Client): Promise<{ success: boolean; error?: string }> {
        try {
            const coach = coachRepository.getCoach(coachId);
            if (!coach) {
                return { success: false, error: COACH_MESSAGES.ERROR_COACH_NOT_FOUND };
            }

            if (!coach.studentIds.includes(studentId)) {
                return { success: false, error: COACH_MESSAGES.ERROR_STUDENT_NOT_FOUND };
            }

            const member = await guild.members.fetch(studentId).catch(() => null);
            if (member) {
                const apprenticeRole = await guild.roles.fetch(coach.roleId);
                if (apprenticeRole) {
                    await member.roles.remove(apprenticeRole).catch(() => { });
                }
            }

            await coachRepository.removeStudent(coachId, studentId);

            if (client) {
                await this.updateCoachDisplayEmbed(client, coachId);

                const updatedCoach = coachRepository.getCoach(coachId);
                if (updatedCoach) {
                    await this.updateTrainingChannelWelcome(client, updatedCoach);
                }
            }

            return { success: true };
        } catch {
            return { success: false, error: 'Erro ao remover aluno.' };
        }
    }

    private async updateTrainingChannelWelcome(client: Client, coach: Coach): Promise<void> {
        try {
            const channel = await ChannelUtils.getTextChannel(client, coach.channelId);
            if (!channel) return;

            const updatedCoach = coachRepository.getCoach(coach.id);
            if (!updatedCoach) return;

            const studentMentions = updatedCoach.studentIds.length > 0
                ? updatedCoach.studentIds.map(id => `<@${id}>`).join(', ')
                : 'Nenhum aluno ainda';

            const messages = await channel.messages.fetch({ limit: 10 });
            const welcomeMessage = messages.find(msg => msg.author.id === client.user?.id && msg.embeds.length > 0);

            const newEmbed = CoachEmbedBuilder.buildTrainingChannelEmbed(updatedCoach, studentMentions);
            const leaveButton = CoachButtonBuilder.buildLeaveCoachButton(updatedCoach.id);

            if (welcomeMessage) {
                await welcomeMessage.edit({ embeds: [newEmbed], components: [leaveButton] });
            } else {
                await channel.send({ embeds: [newEmbed], components: [leaveButton] });
            }
        } catch { }
    }

    async handleLeaveCoachButton(interaction: ButtonInteraction, coachId: string): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const userId = interaction.user.id;
            const coach = coachRepository.getCoach(coachId);
            if (!coach) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_COACH_NOT_FOUND });
                return;
            }

            if (!coach.studentIds.includes(userId)) {
                await interaction.editReply({ content: COACH_MESSAGES.LEAVE_NOT_STUDENT });
                return;
            }

            const confirmEmbed = CoachEmbedBuilder.buildLeaveConfirmEmbed(coach.displayName);
            const confirmButtons = CoachButtonBuilder.buildLeaveConfirmButtons(coachId);

            await interaction.editReply({ embeds: [confirmEmbed], components: [confirmButtons] });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao processar.' }).catch(() => { });
        }
    }

    async handleLeaveConfirmYes(interaction: ButtonInteraction, coachId: string): Promise<void> {
        try {
            await interaction.deferUpdate();

            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply({ content: '❌ Erro ao processar.', embeds: [], components: [] });
                return;
            }

            const userId = interaction.user.id;
            const coach = coachRepository.getCoach(coachId);

            if (!coach) {
                await interaction.editReply({ content: COACH_MESSAGES.ERROR_COACH_NOT_FOUND, embeds: [], components: [] });
                return;
            }

            if (!coach.studentIds.includes(userId)) {
                await interaction.editReply({ content: COACH_MESSAGES.LEAVE_NOT_STUDENT, embeds: [], components: [] });
                return;
            }

            const result = await this.removeStudent(guild, coachId, userId, interaction.client);

            if (!result.success) {
                await interaction.editReply({ content: result.error || '❌ Erro ao sair do treinador.', embeds: [], components: [] });
                return;
            }

            const successEmbed = CoachEmbedBuilder.buildLeaveSuccessEmbed(coach.displayName);
            await interaction.editReply({ embeds: [successEmbed], components: [] });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao processar.', embeds: [], components: [] }).catch(() => { });
        }
    }

    async handleLeaveConfirmNo(interaction: ButtonInteraction): Promise<void> {
        try {
            await interaction.deferUpdate();

            const cancelledEmbed = CoachEmbedBuilder.buildLeaveCancelledEmbed();
            await interaction.editReply({ embeds: [cancelledEmbed], components: [] });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao processar.', embeds: [], components: [] }).catch(() => { });
        }
    }

    async handleLeaveCoachGeneralButton(interaction: ButtonInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const userId = interaction.user.id;
            const coaches = coachRepository.getAllCoaches();
            const myCoach = coaches.find(coach => coach.studentIds.includes(userId));

            if (!myCoach) {
                await interaction.editReply({ content: COACH_MESSAGES.LEAVE_NO_COACH });
                return;
            }

            const confirmEmbed = CoachEmbedBuilder.buildLeaveConfirmEmbed(myCoach.displayName);
            const confirmButtons = CoachButtonBuilder.buildLeaveConfirmButtons(myCoach.id);

            await interaction.editReply({ embeds: [confirmEmbed], components: [confirmButtons] });
        } catch {
            await interaction.editReply({ content: '❌ Erro ao processar.' }).catch(() => { });
        }
    }
}

export const coachService = new CoachService();
