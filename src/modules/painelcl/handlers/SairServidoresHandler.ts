import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getWhitelistService, getGuildService } from '../../../lib/selfbot';

const whitelistService = getWhitelistService();
const guildService = getGuildService();

export class SairServidoresHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        if (!client) {
            await this.replyClientOffline(interaction);
            return;
        }
        
        if (guildService.isRunning()) {
            guildService.stop();
            await interaction.editReply({ content: MESSAGES.SUCCESS.STOPPING });
            return;
        }
        
        const { userId } = this.getUserContext(interaction);
        const guildCount = guildService.getGuildCount(client.client);
        
        if (guildCount === 0) {
            await interaction.editReply({ content: MESSAGES.ERRORS.NO_GUILDS });
            return;
        }
        
        const whitelist = this.buildProtectedGuildList(userId, interaction.guildId);
        const whitelistInfo = this.getWhitelistInfo(whitelist.length);
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.SAIR_SERVIDORES(guildCount, whitelistInfo)
        });
        
        const result = await guildService.leaveAllGuilds(client.client, whitelist);
        
        const baseMessage = MESSAGES.RESULTS.SAIR_SERVIDORES(result.left, result.totalGuilds);
        const finalMessage = this.buildResultMessage(baseMessage, {
            skipped: result.skipped,
            errors: result.errors,
            stopped: result.stopped
        });
        
        await interaction.editReply({ content: finalMessage });
    }

    private buildProtectedGuildList(userId: string, currentGuildId: string | null): string[] {
        const userWhitelist = whitelistService.getWhitelist(userId);
        
        if (!currentGuildId) {
            return userWhitelist;
        }

        const protectedGuilds = new Set(userWhitelist);
        protectedGuilds.add(currentGuildId);
        
        return Array.from(protectedGuilds);
    }
}

export const sairServidoresHandler = new SairServidoresHandler();
