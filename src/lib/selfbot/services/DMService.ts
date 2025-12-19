/**
 * DM Service - Handles Direct Message operations for selfbot clients
 * Single Responsibility: Only manages DM cleaning operations
 */

import { Client, Message } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { delay } from '../utils/delay';
import { IDMService } from '../types';

interface DMCleaningState {
    isRunning: boolean;
    shouldStop: boolean;
}

export class DMService implements IDMService {
    private state: DMCleaningState = {
        isRunning: false,
        shouldStop: false
    };

    private readonly logger = Logger.child('[DM]');
    private readonly defaultDelay = 500;

    /**
     * Cleans all messages sent by the selfbot user in a DM
     * @param client - Selfbot client instance
     * @param userId - ID of the user whose DM to clean
     * @param delayMs - Delay between message deletions (rate limit protection)
     * @returns Number of deleted messages
     */
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

    /**
     * Stops the current DM cleaning operation
     */
    stop(): void {
        if (!this.state.isRunning) {
            this.logger.warning('Nenhuma limpeza de DM em andamento');
            return;
        }

        this.state.shouldStop = true;
        this.logger.error('🛑 Parando limpeza de DM...');
    }

    /**
     * Checks if a cleaning operation is in progress
     */
    isRunning(): boolean {
        return this.state.isRunning;
    }

    /**
     * Executes the actual cleanup process
     */
    private async executeCleanup(
        client: Client, 
        userId: string, 
        delayMs: number
    ): Promise<number> {
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

            const { deleted, foundOwn } = await this.deleteOwnMessages(
                client,
                messages,
                delayMs
            );

            deletedCount += deleted;

            if (!foundOwn) {
                hasMore = false;
            }
        }

        this.logResult(deletedCount, user.tag);
        return deletedCount;
    }

    /**
     * Deletes messages that belong to the selfbot user
     */
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

    /**
     * Attempts to delete a single message
     */
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

    /**
     * Checks if a message belongs to the selfbot user
     */
    private isOwnMessage(client: Client, message: Message): boolean {
        return message.author.id === client.user?.id;
    }

    /**
     * Logs the final result of the cleanup
     */
    private logResult(deletedCount: number, userTag: string): void {
        if (this.state.shouldStop) {
            this.logger.warning(`Limpeza parada! Deletadas ${deletedCount} mensagens`);
        } else {
            this.logger.success(`Deletadas ${deletedCount} mensagens suas do DM com ${userTag}`);
        }
    }
}

// Factory function for creating DM service instances
export const createDMService = (): DMService => new DMService();

