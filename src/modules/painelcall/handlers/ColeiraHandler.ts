import { ModalSubmitInteraction, CacheType } from 'discord.js';
import { getClientService, getColeiraService } from '../../../lib/selfbot';
import { Validators } from '../../../lib/validators';
import { MESSAGES, INPUT_IDS } from '../constants';

const clientService = getClientService();
const coleiraService = getColeiraService();

export class ColeiraHandler {
    async handle(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
        const targetUserId = interaction.fields.getTextInputValue(INPUT_IDS.COLEIRA_USER_ID).trim();
        const { id: ownerUserId, username } = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        const validation = Validators.validateDiscordId(targetUserId);
        if (!validation.isValid) {
            await interaction.editReply({ content: '❌ **ID inválido!** O ID deve conter apenas números.' });
            return;
        }

        const client = await clientService.ensureClient(ownerUserId, username);
        if (!client) {
            await interaction.editReply({ content: MESSAGES.RESPONSES.NO_CLIENT });
            return;
        }

        if (coleiraService.isActive(ownerUserId)) {
            coleiraService.stop(ownerUserId);
            await interaction.editReply({ content: MESSAGES.RESPONSES.COLEIRA.STOPPED });
            return;
        }

        const result = await coleiraService.start(client.client, {
            ownerUserId,
            targetUserId
        });

        if (result.message === 'stopped') {
            await interaction.editReply({ content: MESSAGES.RESPONSES.COLEIRA.STOPPED });
            return;
        }

        if (!result.success && result.message === 'owner_not_in_call') {
            await interaction.editReply({ content: MESSAGES.RESPONSES.COLEIRA.NOT_IN_CALL });
            return;
        }

        if (result.success) {
            await interaction.editReply({ 
                content: MESSAGES.RESPONSES.COLEIRA.STARTED(targetUserId) 
            });
        } else {
            await interaction.editReply({ 
                content: MESSAGES.RESPONSES.COLEIRA.ERROR 
            });
        }
    }
}

export const coleiraHandler = new ColeiraHandler();
