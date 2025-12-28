import { BaseCommandHandler, CommandContext, CommandResult } from '../types';
import { nukeService } from '../../nuke';

export class NukeHandler extends BaseCommandHandler {
    readonly command = '!nuke';

    hasPermission(context: CommandContext): boolean {
        const nukeContext = nukeService.getContext(context.member);
        return nukeContext.hasBanPermission;
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const nukeContext = nukeService.getContext(context.member);
        const result = await nukeService.requestNuke(context.channel, nukeContext);

        if (!result.success) {
            return { success: false, message: result.message };
        }

        return { success: true };
    }
}
