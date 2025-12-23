import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getNotificationService } from '../../../lib/selfbot';

const notificationService = getNotificationService();

export class FecharDMsHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        if (!client) {
            await this.replyClientOffline(interaction);
            return;
        }
        
        const { userId } = this.getUserContext(interaction);
        const dmCount = client.dmService.getOpenDMCount(client.client);
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.FECHAR_DMS(dmCount)
        });
        
        const closed = await client.dmService.closeAllDMs(client.client);
        
        await notificationService.notifyFecharDMs(userId, dmCount, closed);
        
        await interaction.editReply({
            content: MESSAGES.RESULTS.FECHAR_DMS(closed)
        });
    }
}

export const fecharDMsHandler = new FecharDMsHandler();

