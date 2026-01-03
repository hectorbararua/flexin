import { Event } from '../core/types';
import { welcomeService } from '../modules/welcome';

export default new Event({
    name: 'guildMemberRemove',
    async run(member) {
        try {
            const guild = member.guild;
            if (!guild) return;

            const guildName = guild.name;
            const leaveType = await welcomeService.detectLeaveType(guild, member.id);
            
            await Promise.all([
                welcomeService.sendGoodbyeMessage(member, member.client, guildName, leaveType),
                welcomeService.sendLogMessage(member, member.client, guildName),
            ]);
        } catch {}
    },
});
