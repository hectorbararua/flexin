import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getWhitelistService, getNotificationService } from '../../../lib/selfbot';

const whitelistService = getWhitelistService();
const notificationService = getNotificationService();

export class ApagarDMsHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        if (!client) {
            await this.replyClientOffline(interaction);
            return;
        }
        
        const { userId } = this.getUserContext(interaction);
        const dmCount = client.dmService.getOpenDMCount(client.client);
        const whitelist = whitelistService.getWhitelist(userId);
        
        if (dmCount === 0) {
            await interaction.editReply({ content: MESSAGES.ERRORS.NO_DMS });
            return;
        }
        
        const whitelistInfo = this.getWhitelistInfo(whitelist.length);
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.APAGAR_DMS(dmCount, whitelistInfo)
        });
        
        const result = await client.dmService.cleanAllDMs(client.client, 300, whitelist);
        
        await notificationService.notifyApagarDMs(
            userId,
            dmCount,
            result.processed,
            result.totalDeleted,
            result.skipped || 0
        );
        
        const baseMessage = MESSAGES.RESULTS.APAGAR_DMS(result.processed, result.totalDeleted);
        const finalMessage = this.buildResultMessage(baseMessage, { skipped: result.skipped });
        
        await interaction.editReply({ content: finalMessage });
    }
}

export const apagarDMsHandler = new ApagarDMsHandler();

