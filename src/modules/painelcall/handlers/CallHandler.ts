import { ModalSubmitInteraction, CacheType } from 'discord.js';
import { getNotificationService, ActivityType, SelfbotClient } from '../../../lib/selfbot';
import { getClientService } from './ClientService';
import { MESSAGES, INPUT_IDS, EMOJIS, RICH_PRESENCE_CONFIG, CALL_ROLE_CONFIG } from '../constants';
import { ModalInteraction, CallOptions } from '../types';

export interface ICallHandler {
    handle(interaction: ModalInteraction, isMuted: boolean): Promise<void>;
}

export class CallHandler implements ICallHandler {
    private readonly clientService = getClientService();
    private readonly notificationService = getNotificationService();

    async handle(interaction: ModalSubmitInteraction<CacheType>, isMuted: boolean): Promise<void> {
        const callId = interaction.fields.getTextInputValue(INPUT_IDS.CALL_ID);
        const { id: userId, username } = interaction.user;
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            await this.processCall(interaction, userId, username, callId, isMuted);
        } catch {
            await interaction.editReply({ content: MESSAGES.RESPONSES.CALL.ERROR_GENERIC });
        }
    }

    private async processCall(
        interaction: ModalSubmitInteraction<CacheType>,
        userId: string,
        username: string,
        callId: string,
        isMuted: boolean
    ): Promise<void> {
        const client = await this.clientService.ensureClient(userId, username);
        
        if (!client) {
            await interaction.editReply({ content: MESSAGES.RESPONSES.NO_CLIENT });
            return;
        }
        
        client.setUserInfo(userId, username);
        client.setCallRoleConfig(CALL_ROLE_CONFIG);
        
        const callOptions = this.buildCallOptions(isMuted);
        const success = await client.voiceService.join(client.client, callId, callOptions, userId);
        
        if (success) {
            await this.setupRichPresence(client);
            await this.handleJoinSuccess(interaction, userId, callId, client.tag, isMuted);
        } else {
            await interaction.editReply({ content: MESSAGES.RESPONSES.CALL.ERROR_JOIN });
        }
    }

    private async setupRichPresence(client: SelfbotClient): Promise<void> {
        try {
            await client.activityService.setActivity(client.client, {
                applicationId: RICH_PRESENCE_CONFIG.APPLICATION_ID || undefined,
                name: RICH_PRESENCE_CONFIG.NAME,
                type: ActivityType.PLAYING,
                details: RICH_PRESENCE_CONFIG.DETAILS,
                state: RICH_PRESENCE_CONFIG.STATE,
                startTimestamp: true,
                imageUrl: RICH_PRESENCE_CONFIG.IMAGE,
                imageText: RICH_PRESENCE_CONFIG.NAME,
                buttons: [
                    {
                        label: RICH_PRESENCE_CONFIG.BUTTON_LABEL,
                        url: RICH_PRESENCE_CONFIG.BUTTON_URL
                    }
                ]
            });
        } catch {
        }
    }

    private buildCallOptions(isMuted: boolean): CallOptions {
        return {
            selfMute: isMuted,
            selfDeaf: isMuted
        };
    }

    private async handleJoinSuccess(
        interaction: ModalSubmitInteraction<CacheType>,
        userId: string,
        callId: string,
        tag: string | null,
        isMuted: boolean
    ): Promise<void> {
        await this.notificationService.notifyCallJoin(userId, `Canal ${callId}`, callId);
        
        const muteStatus = this.getMuteStatus(isMuted);
        const displayTag = tag ?? 'Desconhecido';
        
        await interaction.editReply({ 
            content: MESSAGES.RESPONSES.CALL.SUCCESS(callId, displayTag, muteStatus) 
        });
    }

    private getMuteStatus(isMuted: boolean): string {
        return isMuted ? `${EMOJIS.MUTED} Mutado` : `${EMOJIS.UNMUTED} Desmutado`;
    }
}

export const createCallHandler = (): CallHandler => {
    return new CallHandler();
};
