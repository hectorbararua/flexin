import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { banService } from '../../ban';
import { UserUtils } from '../../../shared/utils';

const BLACKLIST_ROLE_ID = '1453512381530505247';

export class UnblHandler extends BaseCommandHandler {
    readonly command = '!unbl';

    hasPermission(context: CommandContext): boolean {
        return context.member.roles.cache.has(BLACKLIST_ROLE_ID);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { args, member } = context;

        if (args.length < 2) {
            return {
                success: false,
                message: '❌ Argumentos insuficientes. Use: `!unbl @usuario`',
            };
        }

        const targetId = UserUtils.extractUserId(args[1]);
        if (!targetId) {
            return { success: false, message: '❌ Usuário não encontrado.' };
        }

        const banContext = banService.getContext(member);
        const result = await banService.removeFromBlacklist(context.message.guild!, targetId, banContext);

        return { success: result.success, message: result.message };
    }
}
