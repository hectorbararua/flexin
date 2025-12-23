import { SelectInteraction, UserContext } from '../types';
import { MESSAGES } from '../constants';
import { getClientService, SelfbotClient } from '../../../lib/selfbot';

const clientService = getClientService();

export abstract class BaseHandler {
    protected async getClient(interaction: SelectInteraction): Promise<SelfbotClient | null> {
        const { userId, username } = this.getUserContext(interaction);
        return clientService.ensureClient(userId, username);
    }

    protected getUserContext(interaction: SelectInteraction): UserContext {
        return {
            userId: interaction.user.id,
            username: interaction.user.username
        };
    }

    protected async replyError(interaction: SelectInteraction, message: string): Promise<void> {
        await interaction.editReply({ content: message });
    }

    protected async replyClientOffline(interaction: SelectInteraction): Promise<void> {
        await this.replyError(interaction, MESSAGES.ERRORS.CLIENT_OFFLINE);
    }

    protected buildResultMessage(
        baseMessage: string, 
        options: { skipped?: number; errors?: number; stopped?: boolean }
    ): string {
        let message = baseMessage;
        
        if (options.skipped && options.skipped > 0) {
            message += MESSAGES.EXTRAS.SKIPPED(options.skipped);
        }
        
        if (options.errors && options.errors > 0) {
            message += MESSAGES.EXTRAS.ERRORS(options.errors);
        }
        
        if (options.stopped) {
            message += MESSAGES.EXTRAS.STOPPED;
        }
        
        return message;
    }

    protected getWhitelistInfo(count: number): string {
        return MESSAGES.EXTRAS.WHITELIST_INFO(count);
    }

    abstract handle(interaction: SelectInteraction): Promise<void>;
}
