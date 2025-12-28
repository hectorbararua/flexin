import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { banService } from '../../ban';
import { PERMISSION_GROUPS, hasAnyRole } from '../../../config/roles';
import { UserUtils } from '../../../shared/utils';

export class UnbanHandler extends BaseCommandHandler {
    readonly command = '!unban';

    hasPermission(context: CommandContext): boolean {
        return hasAnyRole(context.member.roles.cache, PERMISSION_GROUPS.BAN_PERMISSION);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { args, member } = context;

        if (args.length < 2) {
            return {
                success: false,
                message: '❌ Argumentos insuficientes. Use: `!unban @usuario`',
            };
        }

        const targetId = UserUtils.extractUserId(args[1]);
        if (!targetId) {
            return { success: false, message: '❌ Usuário não encontrado.' };
        }

        const banContext = banService.getContext(member);
        const result = await banService.unbanUser(context.message.guild!, targetId, banContext);

        return { success: result.success, message: result.message };
    }
}
