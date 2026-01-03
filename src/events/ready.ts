import { Event } from '../core/types';
import { client } from '..';
import { verificationService } from '../modules/verification';
import { channelConfig } from '../config/ChannelConfigService';

export default new Event({
    name: 'ready',
    once: true,
    async run() {
        try {
            const { commands } = client;
            console.log('🆗 Bot Online'.green);
            console.log(`📚 Commands: ${commands.size}`.cyan);

            channelConfig.reload();

            await new Promise(resolve => setTimeout(resolve, 2000));
            await verificationService.initVerificationEmbed(client);
        } catch {}
    },
});
