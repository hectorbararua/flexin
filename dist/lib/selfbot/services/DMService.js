"use strict";
/**
 * DM Service - Handles Direct Message operations for selfbot clients
 * Single Responsibility: Only manages DM cleaning operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDMService = exports.DMService = void 0;
const Logger_1 = require("../utils/Logger");
const delay_1 = require("../utils/delay");
class DMService {
    state = {
        isRunning: false,
        shouldStop: false
    };
    logger = Logger_1.Logger.child('[DM]');
    defaultDelay = 500;
    /**
     * Cleans all messages sent by the selfbot user in a DM
     * @param client - Selfbot client instance
     * @param userId - ID of the user whose DM to clean
     * @param delayMs - Delay between message deletions (rate limit protection)
     * @returns Number of deleted messages
     */
    async cleanDM(client, userId, delayMs = this.defaultDelay) {
        if (this.state.isRunning) {
            this.logger.warning('Limpeza de DM já está em andamento!');
            return 0;
        }
        this.state.isRunning = true;
        this.state.shouldStop = false;
        try {
            return await this.executeCleanup(client, userId, delayMs);
        }
        finally {
            this.state.isRunning = false;
            this.state.shouldStop = false;
        }
    }
    /**
     * Stops the current DM cleaning operation
     */
    stop() {
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
    isRunning() {
        return this.state.isRunning;
    }
    /**
     * Executes the actual cleanup process
     */
    async executeCleanup(client, userId, delayMs) {
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
    /**
     * Deletes messages that belong to the selfbot user
     */
    async deleteOwnMessages(client, messages, delayMs) {
        let deleted = 0;
        let foundOwn = false;
        for (const message of messages.values()) {
            if (this.state.shouldStop)
                break;
            if (this.isOwnMessage(client, message)) {
                const success = await this.deleteMessage(message);
                if (success) {
                    deleted++;
                    foundOwn = true;
                    this.logger.info(`Mensagem deletada! Total: ${deleted}`);
                }
                await (0, delay_1.delay)(delayMs);
            }
        }
        return { deleted, foundOwn };
    }
    /**
     * Attempts to delete a single message
     */
    async deleteMessage(message) {
        try {
            await message.delete();
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Não foi possível deletar: ${errorMessage}`);
            return false;
        }
    }
    /**
     * Checks if a message belongs to the selfbot user
     */
    isOwnMessage(client, message) {
        return message.author.id === client.user?.id;
    }
    /**
     * Logs the final result of the cleanup
     */
    logResult(deletedCount, userTag) {
        if (this.state.shouldStop) {
            this.logger.warning(`Limpeza parada! Deletadas ${deletedCount} mensagens`);
        }
        else {
            this.logger.success(`Deletadas ${deletedCount} mensagens suas do DM com ${userTag}`);
        }
    }
}
exports.DMService = DMService;
// Factory function for creating DM service instances
const createDMService = () => new DMService();
exports.createDMService = createDMService;
