import { ModalInteraction } from '../types';
import { MESSAGES, INPUT_IDS } from '../constants';
import { getClientService, getGuildCloneService } from '../../../lib/selfbot';
import { Validators } from '../../../lib/validators';

const clientService = getClientService();
const cloneService = getGuildCloneService();

export class ClonarServidorHandler {
    async handle(interaction: ModalInteraction): Promise<void> {
        const sourceId = interaction.fields.getTextInputValue(INPUT_IDS.CLONE_SOURCE).trim();
        const targetId = interaction.fields.getTextInputValue(INPUT_IDS.CLONE_TARGET).trim();
        const { id: userId, username } = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        if (!this.validateIds(interaction, sourceId, targetId)) {
            return;
        }

        const client = await clientService.ensureClient(userId, username);
        
        if (!client) {
            await interaction.editReply({ content: MESSAGES.ERRORS.CLIENT_OFFLINE });
            return;
        }

        if (cloneService.isCloning()) {
            cloneService.stop();
            await interaction.editReply({ content: MESSAGES.CLONE.STOPPED });
            return;
        }

        await interaction.editReply({ content: MESSAGES.CLONE.PROCESSING });

        const onProgress = async (message: string) => {
            try {
                await interaction.editReply({ content: MESSAGES.CLONE.PROGRESS(message) });
            } catch {}
        };

        const result = await cloneService.clone(client.client, sourceId, targetId, onProgress);

        if (result.stopped) {
            await interaction.editReply({ content: MESSAGES.CLONE.STOPPED });
            return;
        }

        if (!result.success) {
            const errorMessage = this.getErrorMessage(result.errorType);
            await interaction.editReply({ content: errorMessage });
            return;
        }

        const successMessage = MESSAGES.CLONE.SUCCESS(
            result.isAdmin,
            result.categoriesCreated,
            result.channelsCreated,
            result.rolesCreated,
            result.emojisCreated,
            result.errors
        );

        await interaction.editReply({ content: successMessage });
    }

    private validateIds(interaction: ModalInteraction, sourceId: string, targetId: string): boolean {
        const sourceValidation = Validators.validateDiscordId(sourceId);
        const targetValidation = Validators.validateDiscordId(targetId);

        if (!sourceValidation.isValid || !targetValidation.isValid) {
            interaction.editReply({ content: MESSAGES.ERRORS.INVALID_ID });
            return false;
        }

        return true;
    }

    private getErrorMessage(errorType?: string): string {
        switch (errorType) {
            case 'SOURCE_NOT_FOUND':
                return MESSAGES.CLONE.ERROR_SOURCE_NOT_FOUND;
            case 'TARGET_NOT_FOUND':
                return MESSAGES.CLONE.ERROR_TARGET_NOT_FOUND;
            case 'NO_PERMISSION':
                return MESSAGES.CLONE.ERROR_NO_PERMISSION;
            default:
                return MESSAGES.CLONE.ERROR_GENERIC;
        }
    }
}

export const clonarServidorHandler = new ClonarServidorHandler();

