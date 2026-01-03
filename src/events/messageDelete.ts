import { Event } from '../core/types';
import { verificationService } from '../modules/verification';
import { channelConfig } from '../config/ChannelConfigService';

export default new Event({
    name: 'messageDelete',
    async run(message) {
        try {
            if (message.channelId !== channelConfig.verification.verificationChannelId) return;
            if (message.author?.id !== message.client.user?.id) return;
            if (!message.embeds || message.embeds.length === 0) return;

            await verificationService.initVerificationEmbed(message.client);
        } catch {}
    },
});
