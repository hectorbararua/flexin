import { CommandInteractionOptionResolver, TextChannel, GuildMember, ButtonInteraction } from 'discord.js';
import { Event } from '../core/types';
import { client } from '..';
import { handleVencedorDynamic, handleSalaDynamic, handleSalaModal, handleAdicionarModal } from '../modules/match/TrainingCommand';
import { postService, postRepository, profileRepository, INFLUENCER_ROLE_IDS, PostButtonBuilder } from '../modules/influencer';
import { handleVerificationApproval, VERIFICATION_CUSTOM_IDS, verificationService } from '../modules/verification';
import { banService, BAN_CUSTOM_IDS } from '../modules/ban';
import { nukeService, NUKE_CUSTOM_IDS } from '../modules/nuke';
import { roleHistoryService } from '../modules/rolehistory';

export default new Event({
    name: 'interactionCreate',
    async run(interaction) {
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('treino_modal_sala_')) {
                handleSalaModal(interaction);
                return;
            }
            if (interaction.customId.startsWith('treino_modal_adicionar_')) {
                handleAdicionarModal(interaction);
                return;
            }
            if (interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_ADD_MODAL ||
                interaction.customId === BAN_CUSTOM_IDS.BLACKLIST_REMOVE_MODAL) {
                await banService.handlePanelModal(interaction);
                return;
            }
            client.modals.get(interaction.customId)?.(interaction);
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
                handleVencedorDynamic(interaction);
                return;
            }
            if (interaction.customId.startsWith('treino_sala_')) {
                handleSalaDynamic(interaction);
                return;
            }

            if (interaction.customId === VERIFICATION_CUSTOM_IDS.VERIFY_BUTTON) {
                await verificationService.handleVerifyButton(interaction);
                return;
            }

            if (interaction.customId.startsWith(VERIFICATION_CUSTOM_IDS.APPROVE_BUTTON) ||
                interaction.customId.startsWith(VERIFICATION_CUSTOM_IDS.REJECT_BUTTON)) {
                handleVerificationApproval(interaction);
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

            client.buttons.get(interaction.customId)?.(interaction);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === VERIFICATION_CUSTOM_IDS.VERIFIER_SELECT) {
                await verificationService.handleVerifierSelect(interaction);
                return;
            }

            client.selects.get(interaction.customId)?.(interaction);
            return;
        }

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            if (interaction.isChatInputCommand()) {
                const options = interaction.options as CommandInteractionOptionResolver;
                command.run({ client, interaction, options });
            } else {
                command.run({ client, interaction, options: {} as CommandInteractionOptionResolver });
            }
        }
    },
});

async function handlePostLike(interaction: ButtonInteraction): Promise<void> {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    const result = await postService.handleLike(messageId, userId);

    if (!result) {
        await interaction.reply({
            content: '❌ Post não encontrado.',
            ephemeral: true,
        });
        return;
    }

    const post = postRepository.get(messageId);
    if (!post) return;

    const profiles = profileRepository.getByUser(post.authorId);

    const newButtons = PostButtonBuilder.buildPostButtons(
        post.videoUrl,
        profiles,
        result.count
    );

    await interaction.update({
        components: newButtons.map(row => row.toJSON()),
    });
}

async function handlePostDelete(interaction: ButtonInteraction): Promise<void> {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;
    const member = interaction.member as GuildMember;
    const isAdmin = member.roles.cache.has(INFLUENCER_ROLE_IDS.ADMIN);
    const channel = interaction.channel as TextChannel;

    const result = await postService.deletePost(messageId, userId, isAdmin, channel);

    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true,
        });
        return;
    }

    await interaction.deferUpdate().catch(() => {});
}
