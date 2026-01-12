import { Event } from '../core/types';
import { verificationService } from '../modules/verification';
import { channelConfig } from '../config/ChannelConfigService';
import { coachService, COACH_CHANNEL_IDS } from '../modules/coach';

export default new Event({
    name: 'messageDelete',
    async run(message) {
        try {
            if (message.channelId === channelConfig.verification.verificationChannelId) {
                if (message.author?.id !== message.client.user?.id) return;
                if (!message.embeds || message.embeds.length === 0) return;
                await verificationService.initVerificationEmbed(message.client);
                return;
            }

            if (message.channelId === COACH_CHANNEL_IDS.EMBED_CHANNEL) {
                if (message.author?.id !== message.client.user?.id) return;
                if (!message.embeds || message.embeds.length === 0) return;
                await coachService.initSetupEmbed(message.client);
                return;
            }

            if (message.channelId === COACH_CHANNEL_IDS.LEAVE_COACH_CHANNEL) {
                if (message.author?.id !== message.client.user?.id) return;
                if (!message.embeds || message.embeds.length === 0) return;
                await coachService.initLeaveCoachEmbed(message.client);
                return;
            }
        } catch { }
    },
});
