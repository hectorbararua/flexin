import { Event } from '../core/types';
import { welcomeService } from '../modules/welcome';
import { ROLE_IDS } from '../modules/verification';
import { banService } from '../modules/ban';

export default new Event({
    name: 'guildMemberAdd',
    async run(member) {
        try {
            const wasBlacklisted = await banService.checkBlacklistOnJoin(member);
            if (wasBlacklisted) return;

            try {
                await member.roles.add(ROLE_IDS.UNVERIFIED);
            } catch {}

            await welcomeService.sendWelcomeMessage(member);
        } catch {}
    },
});
