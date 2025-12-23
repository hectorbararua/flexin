import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getWhitelistService, getNotificationService } from '../../../lib/selfbot';

const whitelistService = getWhitelistService();
const notificationService = getNotificationService();

export class LimparTudoHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        if (!client) {
            await this.replyClientOffline(interaction);
            return;
        }
        
        const { userId } = this.getUserContext(interaction);
        const friendCount = client.dmService.getFriendCount(client.client);
        const whitelist = whitelistService.getWhitelist(userId);
        const whitelistInfo = this.getWhitelistInfo(whitelist.length);
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.LIMPAR_TUDO(friendCount, whitelistInfo)
        });
        
        const result = await client.dmService.cleanAllFriends(client.client, 300, whitelist);
        
        await notificationService.notifyLimparTudo(
            userId,
            result.totalFriends || 0,
            result.processed,
            result.totalDeleted,
            result.skipped || 0
        );
        
        const baseMessage = MESSAGES.RESULTS.LIMPAR_TUDO(
            result.processed,
            result.totalFriends || 0,
            result.totalDeleted
        );
        
        const finalMessage = this.buildResultMessage(baseMessage, {
            skipped: result.skipped
        });
        
        await interaction.editReply({ content: finalMessage });
    }
}

export const limparTudoHandler = new LimparTudoHandler();

