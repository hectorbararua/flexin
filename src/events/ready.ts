import { Event } from '../core/types';
import { client } from '..';
import { verificationService } from '../modules/verification';
import { channelConfig } from '../config/ChannelConfigService';
import { RankingService } from '../modules/ranking/RankingService';
import { mvpService } from '../modules/mvp/MvpService';
import { coachService } from '../modules/coach';

const rankingService = new RankingService();

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
            await coachService.initSetupEmbed(client);
            await coachService.initLeaveCoachEmbed(client);

            console.log('📊 Atualizando rankings...'.yellow);
            await rankingService.sendRankingUpdate(client, 'normal');
            await rankingService.sendRankingUpdate(client, 'feminino');
            await mvpService.sendRankingUpdate(client, 'normal');
            await mvpService.sendRankingUpdate(client, 'feminino');
            console.log('✅ Rankings atualizados!'.green);
        } catch { }
    },
});
