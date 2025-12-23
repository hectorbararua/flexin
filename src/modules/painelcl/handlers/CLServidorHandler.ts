import { ModalInteraction } from '../types';
import { MESSAGES, INPUT_IDS } from '../constants';
import { Validators } from '../validators';
import { getClientService } from '../../../lib/selfbot';
import { createServerCleanService, ServerCleanService } from '../../../lib/selfbot/services/ServerCleanService';

const clientService = getClientService();

class CLServidorHandler {
    private serverCleanService: ServerCleanService | null = null;

    async handle(interaction: ModalInteraction): Promise<void> {
        const serverId = Validators.sanitizeInput(
            interaction.fields.getTextInputValue(INPUT_IDS.SERVER_ID)
        );
        const { id: userId, username } = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        if (!Validators.isValidDiscordId(serverId)) {
            await interaction.editReply({ content: MESSAGES.ERRORS.INVALID_ID });
            return;
        }

        const client = await clientService.ensureClient(userId, username);

        if (!client) {
            await interaction.editReply({ content: MESSAGES.ERRORS.CLIENT_OFFLINE });
            return;
        }

        this.serverCleanService = createServerCleanService();

        this.serverCleanService.onProgress(async (message) => {
            try {
                await interaction.editReply({
                    content: `🏠 **Limpando servidor...**\n\n${message}`
                });
            } catch {}
        });

        await interaction.editReply({
            content: MESSAGES.PROCESSING.CL_SERVIDOR('Analisando...')
        });

        const result = await this.serverCleanService.cleanServer(client.client, serverId);

        if (!result.success) {
            await interaction.editReply({ content: MESSAGES.ERRORS.SERVER_NOT_FOUND });
            return;
        }

        await interaction.editReply({
            content: MESSAGES.RESULTS.CL_SERVIDOR(
                result.guildName,
                result.processedChannels,
                result.totalDeleted,
                result.stopped
            )
        });

        this.serverCleanService = null;
    }

    stop(): void {
        if (this.serverCleanService) {
            this.serverCleanService.stop();
        }
    }

    isRunning(): boolean {
        return this.serverCleanService?.isRunning() || false;
    }
}

export const clServidorHandler = new CLServidorHandler();

