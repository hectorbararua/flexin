import { Client, Message, TextChannel, Guild } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { delay } from '../utils/delay';

interface ServerCleanState {
    isRunning: boolean;
    shouldStop: boolean;
}

interface ChannelCleanResult {
    channelName: string;
    deleted: number;
}

interface ServerCleanResult {
    success: boolean;
    guildName: string;
    totalChannels: number;
    processedChannels: number;
    totalDeleted: number;
    channelResults: ChannelCleanResult[];
    stopped: boolean;
}

export class ServerCleanService {
    private state: ServerCleanState = {
        isRunning: false,
        shouldStop: false
    };

    private readonly logger = Logger.child('[ServerClean]');
    private readonly defaultDelay = 300;
    private onProgressCallback: ((message: string) => void) | null = null;

    onProgress(callback: (message: string) => void): void {
        this.onProgressCallback = callback;
    }

    private notifyProgress(message: string): void {
        if (this.onProgressCallback) {
            this.onProgressCallback(message);
        }
    }

    async cleanServer(
        client: Client, 
        guildId: string, 
        delayMs: number = this.defaultDelay
    ): Promise<ServerCleanResult> {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza de servidor já está em andamento!');
            return this.createErrorResult('Operação já em andamento');
        }

        this.state.isRunning = true;
        this.state.shouldStop = false;

        try {
            const guild = await this.fetchGuild(client, guildId);
            
            if (!guild) {
                return this.createErrorResult('Servidor não encontrado');
            }

            this.logger.info(`Iniciando limpeza no servidor: ${guild.name}`);
            this.notifyProgress(`🔍 Analisando servidor: **${guild.name}**`);

            const textChannels = this.getTextChannels(guild);
            
            if (textChannels.length === 0) {
                return this.createErrorResult('Nenhum canal de texto encontrado');
            }

            this.logger.info(`Encontrados ${textChannels.length} canais de texto`);
            this.notifyProgress(`📁 Encontrados **${textChannels.length}** canais de texto`);

            return await this.processChannels(client, guild, textChannels, delayMs);
        } catch (error) {
            this.logger.error(`Erro ao limpar servidor: ${error}`);
            return this.createErrorResult('Erro ao processar servidor');
        } finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }

    private async fetchGuild(client: Client, guildId: string): Promise<Guild | null> {
        try {
            return await client.guilds.fetch(guildId);
        } catch {
            this.logger.error(`Servidor não encontrado: ${guildId}`);
            return null;
        }
    }

    private getTextChannels(guild: Guild): TextChannel[] {
        const channels: TextChannel[] = [];
        
        guild.channels.cache.forEach((channel: any) => {
            if (this.isTextChannel(channel)) {
                channels.push(channel as TextChannel);
            }
        });

        return channels;
    }

    private isTextChannel(channel: any): boolean {
        if (!channel) return false;
        return channel.type === 'GUILD_TEXT' || 
               channel.type === 0 ||
               (typeof channel.isText === 'function' && channel.isText() && channel.guild);
    }

    private async processChannels(
        client: Client,
        guild: Guild,
        channels: TextChannel[],
        delayMs: number
    ): Promise<ServerCleanResult> {
        const result: ServerCleanResult = {
            success: true,
            guildName: guild.name,
            totalChannels: channels.length,
            processedChannels: 0,
            totalDeleted: 0,
            channelResults: [],
            stopped: false
        };

        for (const channel of channels) {
            if (this.state.shouldStop) {
                result.stopped = true;
                this.logger.warning('Limpeza interrompida pelo usuário');
                break;
            }

            try {
                const canAccess = await this.canAccessChannel(channel);
                
                if (!canAccess) {
                    this.logger.info(`⏭️ Sem acesso: #${channel.name}`);
                    continue;
                }

                this.notifyProgress(
                    `🧹 Limpando: **#${channel.name}**\n` +
                    `📊 Progresso: ${result.processedChannels + 1}/${channels.length}`
                );

                const deleted = await this.cleanChannel(client, channel, delayMs);
                
                result.channelResults.push({
                    channelName: channel.name,
                    deleted
                });
                
                result.totalDeleted += deleted;
                result.processedChannels++;

                if (deleted > 0) {
                    this.logger.success(`#${channel.name}: ${deleted} mensagens deletadas`);
                }
            } catch (error) {
                this.logger.error(`Erro no canal #${channel.name}: ${error}`);
            }
        }

        this.logger.success(
            `Limpeza concluída: ${result.processedChannels} canais, ` +
            `${result.totalDeleted} mensagens deletadas`
        );

        return result;
    }

    private async canAccessChannel(channel: TextChannel): Promise<boolean> {
        try {
            await channel.messages.fetch({ limit: 1 });
            return true;
        } catch {
            return false;
        }
    }

    private async cleanChannel(
        client: Client, 
        channel: TextChannel, 
        delayMs: number
    ): Promise<number> {
        let deletedCount = 0;
        let hasMore = true;
        let lastMessageId: string | undefined;

        while (hasMore && !this.state.shouldStop) {
            try {
                const fetchOptions: { limit: number; before?: string } = { limit: 100 };
                if (lastMessageId) {
                    fetchOptions.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(fetchOptions);

                if (messages.size === 0) {
                    hasMore = false;
                    break;
                }

                lastMessageId = messages.last()?.id;

                const { deleted, foundOwn } = await this.deleteOwnMessages(
                    client, 
                    messages, 
                    delayMs
                );
                
                deletedCount += deleted;

                if (!foundOwn && messages.size < 100) {
                    hasMore = false;
                }
            } catch (error) {
                this.logger.error(`Erro ao buscar mensagens: ${error}`);
                hasMore = false;
            }
        }

        return deletedCount;
    }

    private async deleteOwnMessages(
        client: Client,
        messages: Map<string, Message>,
        delayMs: number
    ): Promise<{ deleted: number; foundOwn: boolean }> {
        let deleted = 0;
        let foundOwn = false;

        for (const message of messages.values()) {
            if (this.state.shouldStop) break;

            if (this.isOwnMessage(client, message)) {
                const success = await this.deleteMessage(message);
                
                if (success) {
                    deleted++;
                    foundOwn = true;
                }

                await delay(delayMs);
            }
        }

        return { deleted, foundOwn };
    }

    private async deleteMessage(message: Message): Promise<boolean> {
        try {
            await message.delete();
            return true;
        } catch {
            return false;
        }
    }

    private isOwnMessage(client: Client, message: Message): boolean {
        return message.author.id === client.user?.id;
    }

    private createErrorResult(reason: string): ServerCleanResult {
        return {
            success: false,
            guildName: reason,
            totalChannels: 0,
            processedChannels: 0,
            totalDeleted: 0,
            channelResults: [],
            stopped: false
        };
    }

    stop(): void {
        if (!this.state.isRunning) {
            this.logger.warning('Nenhuma limpeza de servidor em andamento');
            return;
        }

        this.state.shouldStop = true;
        this.logger.error('🛑 Parando limpeza de servidor...');
    }

    isRunning(): boolean {
        return this.state.isRunning;
    }
}

export const createServerCleanService = (): ServerCleanService => new ServerCleanService();

