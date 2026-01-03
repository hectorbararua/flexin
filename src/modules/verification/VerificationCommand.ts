import {
    ApplicationCommandType,
    GuildMember,
    PermissionFlagsBits,
    TextChannel,
    Collection,
    ButtonInteraction,
    StringSelectMenuInteraction,
} from 'discord.js';
import { Command, ComponentsButton, ComponentsSelect, ComponentsModal } from '../../core/types';
import { verificationService } from './VerificationService';
import { VERIFICATION_CUSTOM_IDS } from './constants';

const buttons: ComponentsButton = new Collection([
    [
        VERIFICATION_CUSTOM_IDS.VERIFY_BUTTON,
        async (interaction: ButtonInteraction) => {
            await verificationService.handleVerifyButton(interaction);
        },
    ],
]);

const selects: ComponentsSelect = new Collection([
    [
        VERIFICATION_CUSTOM_IDS.VERIFIER_SELECT,
        async (interaction: StringSelectMenuInteraction) => {
            await verificationService.handleVerifierSelect(interaction);
        },
    ],
]);

const modals: ComponentsModal = new Collection();

export async function handleVerificationApproval(interaction: ButtonInteraction): Promise<void> {
    try {
        const customId = interaction.customId;

        if (customId.startsWith(VERIFICATION_CUSTOM_IDS.APPROVE_BUTTON)) {
            const requestId = customId.replace(`${VERIFICATION_CUSTOM_IDS.APPROVE_BUTTON}_`, '');
            await verificationService.handleApproval(interaction, requestId, true);
            return;
        }

        if (customId.startsWith(VERIFICATION_CUSTOM_IDS.REJECT_BUTTON)) {
            const requestId = customId.replace(`${VERIFICATION_CUSTOM_IDS.REJECT_BUTTON}_`, '');
            await verificationService.handleApproval(interaction, requestId, false);
            return;
        }
    } catch {}
}

export default new Command({
    name: 'verificacao',
    description: 'Envia o embed de verificação no canal',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    buttons,
    selects,
    modals,

    async run({ interaction }) {
        const member = interaction.member as GuildMember;

        if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '❌ Você não tem permissão para usar este comando.',
                flags: 64,
            });
            return;
        }

        const channel = interaction.channel as TextChannel;

        if (!channel) {
            await interaction.reply({
                content: '❌ Não foi possível encontrar o canal.',
                flags: 64,
            });
            return;
        }

        await interaction.deferReply({ flags: 64 });

        const success = await verificationService.sendVerificationEmbed(channel);

        if (success) {
            await interaction.editReply({
                content: '✅ Embed de verificação enviado com sucesso!',
            });
        } else {
            await interaction.editReply({
                content: '❌ Erro ao enviar embed de verificação.',
            });
        }
    },
});

