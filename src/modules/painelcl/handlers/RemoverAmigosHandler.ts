import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getWhitelistService } from '../../../lib/selfbot';

const whitelistService = getWhitelistService();

export class RemoverAmigosHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        if (!client) {
            await this.replyClientOffline(interaction);
            return;
        }
        
        if (client.friendService.isRunning()) {
            client.friendService.stop();
            await interaction.editReply({ content: MESSAGES.SUCCESS.STOPPING });
            return;
        }
        
        const { userId } = this.getUserContext(interaction);
        const friendCount = client.friendService.getFriendCount(client.client);
        
        if (friendCount === 0) {
            await interaction.editReply({ content: MESSAGES.ERRORS.NO_FRIENDS });
            return;
        }
        
        const whitelist = whitelistService.getWhitelist(userId);
        const whitelistInfo = this.getWhitelistInfo(whitelist.length);
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.REMOVER_AMIGOS(friendCount, whitelistInfo)
        });
        
        const result = await client.friendService.removeAllFriends(client.client, whitelist);
        
        const baseMessage = MESSAGES.RESULTS.REMOVER_AMIGOS(result.removed, result.totalFriends);
        const finalMessage = this.buildResultMessage(baseMessage, {
            skipped: result.skipped,
            errors: result.errors,
            stopped: result.stopped
        });
        
        await interaction.editReply({ content: finalMessage });
    }
}

export const removerAmigosHandler = new RemoverAmigosHandler();

