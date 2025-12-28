import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { banService } from '../../ban';
import { UserUtils } from '../../../shared/utils';

const BLACKLIST_ROLE_ID = '1453512381530505247';

export class BlacklistHandler extends BaseCommandHandler {
    readonly command = '!blacklist';

    hasPermission(context: CommandContext): boolean {
        return context.member.roles.cache.has(BLACKLIST_ROLE_ID);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { args, member, channel } = context;

        if (args.length === 1) {
            await banService.sendBlacklistPanelInChannel(channel);
            return { success: true, persist: true };
        }

        if (args.length >= 3) {
            const targetId = UserUtils.extractUserId(args[1]);
            if (!targetId) {
                return { success: false, message: '❌ Usuário não encontrado.' };
            }

            const reason = args.slice(2).join(' ');
            const banContext = banService.getContext(member);
            const result = await banService.addToBlacklist(context.message.guild!, targetId, reason, banContext);

            return { success: result.success, message: result.message };
        }

        return {
            success: false,
            message: '❌ Argumentos insuficientes. Use: `!blacklist @usuario motivo` ou `!blacklist`',
        };
    }
}
