import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { banService } from '../../ban';
import { PERMISSION_GROUPS, hasAnyRole } from '../../../config/roles';

export class UnbanAllHandler extends BaseCommandHandler {
    readonly command = '!unbanall';

    hasPermission(context: CommandContext): boolean {
        return hasAnyRole(context.member.roles.cache, PERMISSION_GROUPS.UNBAN_ALL_PERMISSION);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { member, channel } = context;

        const loadingReply = await channel.send('⏳ Desbanindo todos os usuários (exceto blacklist)...');
        
        const banContext = banService.getContext(member);
        const result = await banService.unbanAll(context.message.guild!, banContext);
        
        await loadingReply.edit(result.message);
        setTimeout(() => loadingReply.delete().catch(() => {}), 5000);

        return { success: result.success };
    }
}
