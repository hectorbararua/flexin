import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { banService } from '../../ban';
import { PERMISSION_GROUPS, hasAnyRole } from '../../../config/roles';
import { UserUtils } from '../../../shared/utils';

export class BanHandler extends BaseCommandHandler {
    readonly command = '!ban';

    hasPermission(context: CommandContext): boolean {
        return hasAnyRole(context.member.roles.cache, PERMISSION_GROUPS.BAN_PERMISSION);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { args, member, channel } = context;

        if (args.length < 2) {
            return {
                success: false,
                message: '❌ Argumentos insuficientes. Use: `!ban @usuario motivo`',
            };
        }

        const targetId = UserUtils.extractUserId(args[1]);
        if (!targetId) {
            return { success: false, message: '❌ Usuário não encontrado.' };
        }

        const reason = args.slice(2).join(' ');
        if (!reason.trim()) {
            return { success: false, message: '❌ Você precisa informar um motivo para o ban.' };
        }

        const banContext = banService.getContext(member);
        const result = await banService.banUser(context.message.guild!, targetId, reason, banContext);

        return { success: result.success, message: result.message };
    }
}
