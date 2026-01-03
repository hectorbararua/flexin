import { GuildMember, Message, TextChannel } from 'discord.js';
import { ICommandHandler, CommandContext } from './types';
import {
    BanHandler,
    UnbanHandler,
    BlacklistHandler,
    UnblHandler,
    UnbanAllHandler,
    LockHandler,
    UnlockHandler,
    NukeHandler,
    RoleHistoryHandler,
} from './handlers';

export class CommandManager {
    private handlers: Map<string, ICommandHandler> = new Map();

    constructor() {
        this.registerDefaultHandlers();
    }

    private registerDefaultHandlers(): void {
        this.register(new BanHandler());
        this.register(new UnbanHandler());
        this.register(new BlacklistHandler());
        this.register(new UnblHandler());
        this.register(new UnbanAllHandler());
        this.register(new LockHandler());
        this.register(new UnlockHandler());
        this.register(new NukeHandler());
        this.register(new RoleHistoryHandler());
    }

    register(handler: ICommandHandler): void {
        this.handlers.set(handler.command.toLowerCase(), handler);
    }

    isCommand(content: string): boolean {
        if (!content.startsWith('!')) return false;
        const command = content.split(/\s+/)[0].toLowerCase();
        return this.handlers.has(command);
    }

    async handleCommand(message: Message): Promise<void> {
        const content = message.content.trim();
        const args = content.split(/\s+/);
        const commandName = args[0].toLowerCase();

        const handler = this.handlers.get(commandName);
        if (!handler) return;

        const member = message.member as GuildMember;
        const channel = message.channel as TextChannel;

        await message.delete().catch(() => {});

        const context: CommandContext = {
            message,
            args,
            member,
            channel,
            rawContent: content,
        };

        if (handler.hasPermission && !handler.hasPermission(context)) {
            await this.sendTempMessage(channel, '❌ Você não tem permissão para usar este comando.');
            return;
        }

        try {
            const result = await handler.execute(context);

            if (result.message) {
                if (result.persist) {
                    await channel.send(result.message);
                } else {
                    await this.sendTempMessage(channel, result.message);
                }
            }
        } catch {
            await this.sendTempMessage(channel, '❌ Erro ao executar o comando.');
        }
    }

    private async sendTempMessage(channel: TextChannel, content: string): Promise<void> {
        const reply = await channel.send(content);
        setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
}

export const commandManager = new CommandManager();
