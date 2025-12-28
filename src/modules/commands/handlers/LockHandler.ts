import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { lockService } from '../../lock';

export class LockHandler extends BaseCommandHandler {
    readonly command = '!trancar';

    hasPermission(context: CommandContext): boolean {
        return lockService.hasPermission(context.member);
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const result = await lockService.lockChannel(context.channel, context.member);
        return {
            success: result.success,
            message: result.message,
            persist: result.success,
        };
    }
}
