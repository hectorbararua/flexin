import { Client, Message, DMChannel } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { delay } from '../utils/delay';
import { IDMService } from '../types';

interface GroupDMChannel {
    id: string;
    type: string;
    name?: string;
    messages: {
        fetch(options: { limit: number }): Promise<Map<string, Message>>;
    };
    delete(): Promise<void>;
}

type DMChannelType = DMChannel | GroupDMChannel;

interface DMCleaningState {
    isRunning: boolean;
    shouldStop: boolean;
}

interface CleanAllResult {
    processed: number;
    totalDeleted: number;
    totalFriends?: number;
    skipped?: number;
}

export class DMService implements IDMService {
    private state: DMCleaningState = {
        isRunning: false,
        shouldStop: false
    };

    private readonly logger = Logger.child('[DM]');
    private readonly defaultDelay = 300;

    async cleanDM(client: Client, userId: string, delayMs: number = this.defaultDelay): Promise<number> {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza de DM já está em andamento!');
            return 0;
        }

        this.state.isRunning = true;
        this.state.shouldStop = false;

        try {
            return await this.executeCleanup(client, userId, delayMs);
        } finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }

    async cleanById(client: Client, targetId: string, delayMs: number = this.defaultDelay): Promise<{ deleted: number; type: 'user' | 'group' | 'unknown'; name: string }> {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza já está em andamento!');
            return { deleted: 0, type: 'unknown', name: '' };
        }

        this.state.isRunning = true;
        this.state.shouldStop = false;

        try {
            const channel = await this.findChannelById(client, targetId);
            
            if (channel) {
                const isGroup = (channel as any).type === 'GROUP_DM';
                const name = isGroup 
                    ? ((channel as any).name || 'Grupo sem nome')
                    : ((channel as any).recipient?.tag || targetId);
                
                if (isGroup) {
                    const deleted = await this.cleanGroupDMById(client, channel, delayMs);
                    return { deleted, type: 'group', name };
                } else {
                    const deleted = await this.cleanDMChannel(client, channel as DMChannel, delayMs);
                    return { deleted, type: 'user', name };
                }
            }
            
            try {
                const deleted = await this.executeCleanup(client, targetId, delayMs);
                const user = await client.users.fetch(targetId);
                return { deleted, type: 'user', name: user.tag };
            } catch {
                this.logger.error(`ID não encontrado: ${targetId}`);
                return { deleted: 0, type: 'unknown', name: targetId };
            }
        } finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }

    private async findChannelById(client: Client, channelId: string): Promise<DMChannelType | null> {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel && this.isDMOrGroupChannel(channel)) {
                return channel as DMChannelType;
            }
        } catch {}
        
        for (const [, channel] of client.channels.cache) {
            if (channel.id === channelId && this.isDMOrGroupChannel(channel)) {
                return channel as DMChannelType;
            }
        }
        
        return null;
    }

    private async cleanDMChannel(client: Client, channel: DMChannel, delayMs: number): Promise<number> {
        const recipientTag = channel.recipient?.tag || 'Desconhecido';
        this.logger.info(`🧹 Limpando DM com: ${recipientTag}`);

        let deletedCount = 0;
        let hasMore = true;

        while (hasMore && !this.state.shouldStop) {
            const messages = await channel.messages.fetch({ limit: 100 });

            if (messages.size === 0) {
                hasMore = false;
                break;
            }

            const { deleted, foundOwn } = await this.deleteOwnMessages(client, messages, delayMs);
            deletedCount += deleted;

            if (!foundOwn) {
                hasMore = false;
            }
        }

        this.logger.success(`DM ${recipientTag}: ${deletedCount} mensagens deletadas`);
        return deletedCount;
    }

    private async cleanGroupDMById(client: Client, channel: DMChannelType, delayMs: number): Promise<number> {
        const groupName = (channel as any).name || 'Grupo sem nome';
        this.logger.info(`🧹 Limpando grupo: ${groupName}`);

        let deletedCount = 0;
        let hasMore = true;

        while (hasMore && !this.state.shouldStop) {
            const messages = await (channel as any).messages.fetch({ limit: 100 });

            if (messages.size === 0) {
                hasMore = false;
                break;
            }

            const { deleted, foundOwn } = await this.deleteOwnMessages(client, messages, delayMs);
            deletedCount += deleted;

            if (!foundOwn) {
                hasMore = false;
            }
        }

        this.logger.success(`Grupo ${groupName}: ${deletedCount} mensagens deletadas`);
        return deletedCount;
    }

    async cleanAllDMs(client: Client, delayMs: number = this.defaultDelay, whitelist: string[] = []): Promise<CleanAllResult> {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza de DM já está em andamento!');
            return { processed: 0, totalDeleted: 0 };
        }

        this.state.isRunning = true;
        this.state.shouldStop = false;

        const result: CleanAllResult = { processed: 0, totalDeleted: 0, skipped: 0 };

        try {
            const dmChannels = this.getOpenDMChannels(client);
            this.logger.info(`Encontradas ${dmChannels.length} DMs/Grupos abertos`);

            for (const channel of dmChannels) {
                if (this.state.shouldStop) break;

                const isGroup = (channel as any).type === 'GROUP_DM';
                
                if (isGroup) {
                    const deleted = await this.cleanGroupDM(client, channel as GroupDMChannel, delayMs);
                    result.totalDeleted += deleted;
                    result.processed++;
                } else {
                    const recipientId = this.getRecipientId(channel as DMChannel);
                    if (!recipientId) continue;

                    if (whitelist.includes(recipientId)) {
                        this.logger.info(`⏭️ Pulando ID na whitelist: ${recipientId}`);
                        result.skipped = (result.skipped || 0) + 1;
                        continue;
                    }

                    try {
                        const deleted = await this.executeCleanup(client, recipientId, delayMs);
                        result.totalDeleted += deleted;
                        result.processed++;
                    } catch (err) {
                        this.logger.error(`Erro ao limpar DM: ${err}`);
                    }
                }
            }

            this.logger.success(`Limpeza concluída: ${result.processed} DMs/Grupos, ${result.totalDeleted} mensagens, ${result.skipped || 0} pulados`);
            return result;
        } finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }

    async cleanAllFriends(client: Client, delayMs: number = this.defaultDelay, whitelist: string[] = []): Promise<CleanAllResult> {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza já está em andamento!');
            return { processed: 0, totalDeleted: 0, totalFriends: 0, skipped: 0 };
        }

        this.state.isRunning = true;
        this.state.shouldStop = false;

        const result: CleanAllResult = { processed: 0, totalDeleted: 0, totalFriends: 0, skipped: 0 };

        try {
            const friends = client.relationships.friendCache;
            result.totalFriends = friends.size;

            this.logger.info(`👥 Total de amigos encontrados: ${friends.size}`);

            for (const [userId, user] of friends) {
                if (this.state.shouldStop) {
                    this.logger.warning('Limpeza interrompida pelo usuário');
                    break;
                }

                const username = user?.username || user?.tag || userId;

                if (whitelist.includes(userId)) {
                    this.logger.info(`⏭️ Pulando ${username} (whitelist)`);
                    result.skipped = (result.skipped || 0) + 1;
                    continue;
                }

                this.logger.info(`🧹 Limpando DM com: ${username} (${result.processed + 1}/${friends.size})`);

                try {
                    const deleted = await this.executeCleanup(client, userId, delayMs);
                    result.totalDeleted += deleted;
                    result.processed++;
                } catch (err) {
                    this.logger.error(`Erro ao limpar DM com ${username}: ${err}`);
                    result.processed++;
                }
            }

            this.logger.success(`✅ Limpeza concluída: ${result.processed}/${result.totalFriends} amigos, ${result.totalDeleted} mensagens, ${result.skipped || 0} pulados`);
            return result;
        } finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }

    getFriendCount(client: Client): number {
        return client.relationships.friendCache.size;
    }

    async closeAllDMs(client: Client): Promise<number> {
        const dmChannels = this.getOpenDMChannels(client);
        let closed = 0;

        this.logger.info(`Fechando ${dmChannels.length} DMs/Grupos...`);

        for (const channel of dmChannels) {
            if (this.state.shouldStop) break;

            try {
                await (channel as any).delete();
                closed++;
                await delay(300);
            } catch (err) {
                this.logger.error(`Erro ao fechar DM/Grupo: ${err}`);
            }
        }

        this.logger.success(`Fechadas ${closed} DMs/Grupos`);
        return closed;
    }

    async deleteDM(client: Client, channelId: string): Promise<boolean> {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel && this.isDMChannel(channel)) {
                await (channel as DMChannel).delete();
                return true;
            }
            return false;
        } catch (err) {
            this.logger.error(`Erro ao deletar DM: ${err}`);
            return false;
        }
    }

    getOpenDMChannels(client: Client): DMChannelType[] {
        const dms: DMChannelType[] = [];
        
        client.channels.cache.forEach((channel: any) => {
            if (this.isDMOrGroupChannel(channel)) {
                dms.push(channel as DMChannelType);
            }
        });
        
        const groupCount = dms.filter(ch => (ch as any).type === 'GROUP_DM').length;
        const dmCount = dms.length - groupCount;
        
        this.logger.info(`📬 DMs: ${dmCount} | Grupos: ${groupCount} | Total: ${dms.length}`);
        return dms;
    }

    getOpenDMCount(client: Client): number {
        let count = 0;
        
        client.channels.cache.forEach((channel: any) => {
            if (this.isDMOrGroupChannel(channel)) {
                count++;
            }
        });
        
        return count;
    }

    private isDMOrGroupChannel(channel: any): boolean {
        if (!channel) return false;
        return channel.type === 'DM' || channel.type === 'GROUP_DM';
    }

    stop(): void {
        if (!this.state.isRunning) {
            this.logger.warning('Nenhuma limpeza de DM em andamento');
            return;
        }

        this.state.shouldStop = true;
        this.logger.error('🛑 Parando limpeza de DM...');
    }

    isRunning(): boolean {
        return this.state.isRunning;
    }

    private async executeCleanup(client: Client, userId: string, delayMs: number): Promise<number> {
        this.logger.info(`Buscando usuário: ${userId}`);
        
        const user = await client.users.fetch(userId);
        const dm = await user.createDM();

        let deletedCount = 0;
        let hasMore = true;

        this.logger.info(`Iniciando limpeza de DM com: ${user.tag}`);

        while (hasMore && !this.state.shouldStop) {
            const messages = await dm.messages.fetch({ limit: 100 });

            if (messages.size === 0) {
                hasMore = false;
                break;
            }

            const { deleted, foundOwn } = await this.deleteOwnMessages(client, messages, delayMs);
            deletedCount += deleted;

            if (!foundOwn) {
                hasMore = false;
            }
        }

        this.logResult(deletedCount, user.tag);
        return deletedCount;
    }

    private async cleanGroupDM(client: Client, channel: GroupDMChannel, delayMs: number): Promise<number> {
        const groupName = (channel as any).name || 'Grupo sem nome';
        this.logger.info(`🧹 Limpando grupo: ${groupName}`);

        let deletedCount = 0;
        let hasMore = true;

        while (hasMore && !this.state.shouldStop) {
            const messages = await channel.messages.fetch({ limit: 100 });

            if (messages.size === 0) {
                hasMore = false;
                break;
            }

            const { deleted, foundOwn } = await this.deleteOwnMessages(client, messages, delayMs);
            deletedCount += deleted;

            if (!foundOwn) {
                hasMore = false;
            }
        }

        this.logger.success(`Grupo ${groupName}: ${deletedCount} mensagens deletadas`);
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
                    this.logger.info(`Mensagem deletada! Total: ${deleted}`);
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Não foi possível deletar: ${errorMessage}`);
            return false;
        }
    }

    private isOwnMessage(client: Client, message: Message): boolean {
        return message.author.id === client.user?.id;
    }

    private isDMChannel(channel: any): boolean {
        return this.isDMOrGroupChannel(channel);
    }

    private getRecipientId(channel: DMChannel): string | null {
        return channel.recipient?.id || null;
    }

    private logResult(deletedCount: number, userTag: string): void {
        if (this.state.shouldStop) {
            this.logger.warning(`Limpeza parada! Deletadas ${deletedCount} mensagens`);
        } else {
            this.logger.success(`Deletadas ${deletedCount} mensagens suas do DM com ${userTag}`);
        }
    }
}

export const createDMService = (): DMService => new DMService();
