import { GuildMember, Message, TextChannel } from 'discord.js';

export interface ICommandHandler {
    readonly command: string;
    execute(context: CommandContext): Promise<CommandResult>;
    hasPermission?(context: CommandContext): boolean;
}

export interface CommandContext {
    message: Message;
    args: string[];
    member: GuildMember;
    channel: TextChannel;
    rawContent: string;
}

export interface CommandResult {
    success: boolean;
    message?: string;
    persist?: boolean;
}

export abstract class BaseCommandHandler implements ICommandHandler {
    abstract readonly command: string;
    
    abstract execute(context: CommandContext): Promise<CommandResult>;
    
    hasPermission(_context: CommandContext): boolean {
        return true;
    }

    protected async sendTempMessage(
        channel: TextChannel,
        content: string,
        deleteAfterMs: number = 5000
    ): Promise<void> {
        const reply = await channel.send(content);
        setTimeout(() => reply.delete().catch(() => {}), deleteAfterMs);
    }
}
