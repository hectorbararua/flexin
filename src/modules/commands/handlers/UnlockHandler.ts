import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { lockService } from '../../lock';

export class UnlockHandler extends BaseCommandHandler {
    readonly command = '!destrancar';

    hasPermission(context: CommandContext): boolean {
        return lockService.hasPermission(context.member);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const result = await lockService.unlockChannel(context.channel, context.member);
        return {
            success: result.success,
            message: result.message,
            persist: result.success,
        };
    }
}
