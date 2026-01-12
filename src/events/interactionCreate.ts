import { CommandInteractionOptionResolver, TextChannel, GuildMember, ButtonInteraction } from 'discord.js';
import { Event } from '../core/types';
import { client } from '..';
import { handleVencedorDynamic, handleSalaDynamic, handleSalaModal, handleAdicionarModal } from '../modules/match/TrainingCommand';
import { postService, postRepository, profileRepository, INFLUENCER_ROLE_IDS, PostButtonBuilder } from '../modules/influencer';
import { handleVerificationApproval, VERIFICATION_CUSTOM_IDS, verificationService } from '../modules/verification';
import { banService, BAN_CUSTOM_IDS } from '../modules/ban';
import { nukeService, NUKE_CUSTOM_IDS } from '../modules/nuke';
import { roleHistoryService } from '../modules/rolehistory';
import {
    coachService,
    COACH_CUSTOM_IDS,
    handleCoachAcceptReject,
    handleProfileGameStyleSelect,
    handleProfileTeachingStyleSelect,
    handleProfilePlatformSelect,
    handleProfileAvailabilitySelect,
} from '../modules/coach';
import { feedbackService, FEEDBACK_CUSTOM_IDS, FeedbackRating } from '../modules/feedback';

export default new Event({
    name: 'interactionCreate',
    async run(interaction) {
        try {
            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('treino_modal_sala_')) {
                    await handleSalaModal(interaction);
                    return;
                }
                if (interaction.customId.startsWith('treino_modal_adicionar_')) {
                    await handleAdicionarModal(interaction);
                    return;
                }
                if (interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_ADD_MODAL ||
                    interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_REMOVE_MODAL) {
                    await banService.handlePanelModal(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.FORM_MODAL) {
                    await coachService.handleFormModal(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.MAIN_MODAL) {
                    await coachService.handleMainModal(interaction);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.MODAL_COMMENT)) {
                    await feedbackService.handleCommentModal(interaction);
                    return;
                }
                await client.modals.get(interaction.customId)?.(interaction);
                return;
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'post_like') {
                    await handlePostLike(interaction);
                    return;
                }
                if (interaction.customId === 'post_delete') {
                    await handlePostDelete(interaction);
                    return;
                }
                if (interaction.customId.startsWith('treino_vencedor_')) {
                    await handleVencedorDynamic(interaction);
                    return;
                }
                if (interaction.customId.startsWith('treino_sala_')) {
                    await handleSalaDynamic(interaction);
                    return;
                }
                if (interaction.customId === VERIFICATION_CUSTOM_IDS.VERIFY_BUTTON) {
                    await verificationService.handleVerifyButton(interaction);
                    return;
                }
                if (interaction.customId.startsWith(VERIFICATION_CUSTOM_IDS.APPROVE_BUTTON) ||
                    interaction.customId.startsWith(VERIFICATION_CUSTOM_IDS.REJECT_BUTTON)) {
                    await handleVerificationApproval(interaction);
                    return;
                }
                if (interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_ADD ||
                    interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_REMOVE ||
                    interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_LIST) {
                    await banService.handlePanelButton(interaction);
                    return;
                }
                if (interaction.customId === NUKE_CUSTOM_IDS.CONFIRM ||
                    interaction.customId === NUKE_CUSTOM_IDS.CANCEL) {
                    await nukeService.handleNukeButton(interaction);
                    return;
                }
                if (interaction.customId.startsWith('rolehistory_')) {
                    await roleHistoryService.handleButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.REQUEST_COACH_BUTTON) {
                    await coachService.handleRequestCoachButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.FILL_FORM_BUTTON ||
                    interaction.customId === COACH_CUSTOM_IDS.START_FORM_BUTTON) {
                    await coachService.handleStartFormButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.CLOSE_TICKET_BUTTON) {
                    await coachService.handleCloseTicketButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.FORM_FPS + '_button') {
                    await coachService.handleFpsPingButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.MAIN_MODAL + '_button') {
                    await coachService.handleMainButton(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.BTN_CONFIRM_AVAILABILITY) {
                    await coachService.handleConfirmAvailabilityButton(interaction);
                    return;
                }
                if (interaction.customId.startsWith(COACH_CUSTOM_IDS.ACCEPT_STUDENT) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.REJECT_STUDENT) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.BTN_GAME_STYLE) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.BTN_TEACHING_STYLE) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.BTN_PLATFORM) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.BTN_AVAILABILITY) ||
                    interaction.customId.startsWith(COACH_CUSTOM_IDS.BTN_EXPERIENCE)) {
                    await handleCoachAcceptReject(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.LEAVE_COACH_GENERAL) {
                    await coachService.handleLeaveCoachGeneralButton(interaction);
                    return;
                }
                if (interaction.customId.startsWith(COACH_CUSTOM_IDS.LEAVE_CONFIRM_YES)) {
                    const coachId = interaction.customId.replace(COACH_CUSTOM_IDS.LEAVE_CONFIRM_YES, '');
                    await coachService.handleLeaveConfirmYes(interaction, coachId);
                    return;
                }
                if (interaction.customId.startsWith(COACH_CUSTOM_IDS.LEAVE_CONFIRM_NO)) {
                    await coachService.handleLeaveConfirmNo(interaction);
                    return;
                }
                if (interaction.customId.startsWith(COACH_CUSTOM_IDS.LEAVE_COACH_BUTTON)) {
                    const coachId = interaction.customId.replace(COACH_CUSTOM_IDS.LEAVE_COACH_BUTTON, '');
                    await coachService.handleLeaveCoachButton(interaction, coachId);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_AVALIAR)) {
                    await feedbackService.handleAvaliarButton(interaction);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_RATING_1)) {
                    await feedbackService.handleRatingButton(interaction, 1 as FeedbackRating);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_RATING_2)) {
                    await feedbackService.handleRatingButton(interaction, 2 as FeedbackRating);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_RATING_3)) {
                    await feedbackService.handleRatingButton(interaction, 3 as FeedbackRating);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_RATING_4)) {
                    await feedbackService.handleRatingButton(interaction, 4 as FeedbackRating);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_RATING_5)) {
                    await feedbackService.handleRatingButton(interaction, 5 as FeedbackRating);
                    return;
                }
                if (interaction.customId.startsWith(FEEDBACK_CUSTOM_IDS.BTN_UPDATE_YES)) {
                    await feedbackService.handleUpdateYesButton(interaction);
                    return;
                }
                if (interaction.customId === FEEDBACK_CUSTOM_IDS.BTN_UPDATE_NO) {
                    await feedbackService.handleUpdateNoButton(interaction);
                    return;
                }
                await client.buttons.get(interaction.customId)?.(interaction);
                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === VERIFICATION_CUSTOM_IDS.VERIFIER_SELECT) {
                    await verificationService.handleVerifierSelect(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.SELECT_GAME_STYLE) {
                    await coachService.handleGameStyleSelect(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.SELECT_TEACHING_STYLE) {
                    await coachService.handleTeachingStyleSelect(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.SELECT_PLATFORM) {
                    await coachService.handlePlatformSelect(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.SELECT_AVAILABILITY) {
                    await coachService.handleAvailabilitySelect(interaction);
                    return;
                }
                if (interaction.customId === COACH_CUSTOM_IDS.SELECT_EXPERIENCE) {
                    await coachService.handleExperienceSelect(interaction);
                    return;
                }
                if (interaction.customId === 'coach_profile_game_style_select') {
                    await handleProfileGameStyleSelect(interaction);
                    return;
                }
                if (interaction.customId === 'coach_profile_teaching_select') {
                    await handleProfileTeachingStyleSelect(interaction);
                    return;
                }
                if (interaction.customId === 'coach_profile_platform_select') {
                    await handleProfilePlatformSelect(interaction);
                    return;
                }
                if (interaction.customId === 'coach_profile_availability_select') {
                    await handleProfileAvailabilitySelect(interaction);
                    return;
                }
                await client.selects.get(interaction.customId)?.(interaction);
                return;
            }

            if (interaction.isCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                if (interaction.isChatInputCommand()) {
                    const options = interaction.options as CommandInteractionOptionResolver;
                    await command.run({ client, interaction, options });
                } else {
                    await command.run({ client, interaction, options: {} as CommandInteractionOptionResolver });
                }
            }
        } catch { }
    },
});

async function handlePostLike(interaction: ButtonInteraction): Promise<void> {
    try {
        const messageId = interaction.message.id;
        const userId = interaction.user.id;

        const result = await postService.handleLike(messageId, userId);

        if (!result) {
            await interaction.reply({ content: '❌ Post não encontrado.', flags: 64 });
            return;
        }

        const post = postRepository.get(messageId);
        if (!post) return;

        const profiles = profileRepository.getByUser(post.authorId);
        const newButtons = PostButtonBuilder.buildPostButtons(post.videoUrl, profiles, result.count);

        await interaction.update({ components: newButtons.map(row => row.toJSON()) });
    } catch { }
}

async function handlePostDelete(interaction: ButtonInteraction): Promise<void> {
    try {
        const messageId = interaction.message.id;
        const userId = interaction.user.id;
        const member = interaction.member as GuildMember;
        const isAdmin = member.roles.cache.has(INFLUENCER_ROLE_IDS.ADMIN);
        const channel = interaction.channel as TextChannel;

        const result = await postService.deletePost(messageId, userId, isAdmin, channel);

        if (!result.success) {
            await interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
            return;
        }

        await interaction.deferUpdate().catch(() => { });
    } catch { }
}
