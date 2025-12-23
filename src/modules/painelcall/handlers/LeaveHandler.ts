import { StringSelectMenuInteraction, CacheType } from 'discord.js';
import { getNotificationService, getColeiraService, SelfbotClient } from '../../../lib/selfbot';
import { getClientService } from './ClientService';
import { MESSAGES } from '../constants';
import { SelectInteraction } from '../types';

export interface ILeaveHandler {
    handle(interaction: SelectInteraction): Promise<void>;
}

export class LeaveHandler implements ILeaveHandler {
    private readonly clientService = getClientService();
    private readonly notificationService = getNotificationService();
    private readonly coleiraService = getColeiraService();

    async handle(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        const { id: userId, username } = interaction.user;
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            await this.processLeave(interaction, userId, username);
        } catch {
            await interaction.editReply({ content: MESSAGES.RESPONSES.LEAVE.ERROR });
        }
    }

    private async processLeave(
        interaction: StringSelectMenuInteraction<CacheType>,
        userId: string,
        username: string
    ): Promise<void> {
        const client = await this.clientService.ensureClient(userId, username);
        
        if (!client) {
            await interaction.editReply({ content: MESSAGES.RESPONSES.NO_TOKEN });
            return;
        }
        
        const targetGuildId = client.voiceService.getTargetGuildId();
        
        if (!targetGuildId) {
            await interaction.editReply({ content: MESSAGES.RESPONSES.LEAVE.NOT_IN_CALL });
            return;
        }
        
        const success = await client.voiceService.leave(client.client, targetGuildId);
        
        if (success) {
            this.clearRichPresence(client);
            this.coleiraService.stop(userId);
            await this.handleLeaveSuccess(interaction, userId);
        } else {
            await interaction.editReply({ content: MESSAGES.RESPONSES.LEAVE.ERROR });
        }
    }

    private clearRichPresence(client: SelfbotClient): void {
        try {
            client.activityService.clearActivity(client.client);
        } catch {
        }
    }

    private async handleLeaveSuccess(
        interaction: StringSelectMenuInteraction<CacheType>,
        userId: string
    ): Promise<void> {
        await this.notificationService.notifyCallLeave(userId, 'Saiu voluntariamente');
        await interaction.editReply({ content: MESSAGES.RESPONSES.LEAVE.SUCCESS });
    }
}

export const createLeaveHandler = (): LeaveHandler => {
    return new LeaveHandler();
};
