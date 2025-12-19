"use strict";
/**
 * SelfbotManager - Orchestrates multiple selfbot client instances
 * Follows Open/Closed Principle - easily extendable for new operations
 * Follows Dependency Inversion - depends on abstractions (interfaces)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelfbotManager = exports.getSelfbotManager = exports.SelfbotManager = void 0;
const types_1 = require("./types");
const SelfbotClient_1 = require("./SelfbotClient");
const Logger_1 = require("./utils/Logger");
const delay_1 = require("./utils/delay");
class SelfbotManager {
    clients = new Map();
    config;
    logger = Logger_1.Logger.child('[Manager]');
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_MANAGER_CONFIG, ...config };
    }
    // ============================================
    // CLIENT MANAGEMENT
    // ============================================
    /**
     * Adds a new selfbot client to the manager
     * @param config - Configuration for the new client
     * @returns The ID of the created client
     */
    addClient(config) {
        const client = (0, SelfbotClient_1.createSelfbotClient)(config);
        this.clients.set(client.id, client);
        this.logger.info(`Cliente adicionado: ${client.label} (${client.id})`);
        return client.id;
    }
    /**
     * Adds multiple clients at once
     * @param configs - Array of client configurations
     * @returns Array of created client IDs
     */
    addClients(configs) {
        return configs.map(config => this.addClient(config));
    }
    /**
     * Removes a client from the manager
     * @param clientId - ID of the client to remove
     */
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (!client) {
            this.logger.warning(`Cliente não encontrado: ${clientId}`);
            return false;
        }
        client.logout();
        this.clients.delete(clientId);
        this.logger.info(`Cliente removido: ${client.label}`);
        return true;
    }
    /**
     * Gets a specific client by ID
     */
    getClient(clientId) {
        return this.clients.get(clientId);
    }
    /**
     * Gets a client by index (useful for sequential operations)
     */
    getClientByIndex(index) {
        const clientsArray = Array.from(this.clients.values());
        return clientsArray[index];
    }
    /**
     * Gets all clients as an array
     */
    getAllClients() {
        return Array.from(this.clients.values());
    }
    /**
     * Gets the number of registered clients
     */
    get clientCount() {
        return this.clients.size;
    }
    // ============================================
    // LOGIN / LOGOUT OPERATIONS
    // ============================================
    /**
     * Logs in all registered clients sequentially
     */
    async loginAll() {
        this.logger.info(`Iniciando login de ${this.clients.size} clientes...`);
        const reports = [];
        let successful = 0;
        let failed = 0;
        for (const client of this.clients.values()) {
            const result = await client.login();
            const report = {
                clientId: client.id,
                clientLabel: client.label,
                result: result ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
                message: result ? 'Login realizado com sucesso' : 'Falha no login'
            };
            reports.push(report);
            result ? successful++ : failed++;
            // Delay between logins to avoid rate limiting
            await (0, delay_1.delay)(this.config.delayBetweenAccounts);
        }
        this.logger.success(`Login completo: ${successful} sucesso, ${failed} falhas`);
        return {
            totalClients: this.clients.size,
            successful,
            failed,
            skipped: 0,
            reports
        };
    }
    /**
     * Logs out all clients
     */
    async logoutAll() {
        this.logger.info('Desconectando todos os clientes...');
        for (const client of this.clients.values()) {
            await client.logout();
            await (0, delay_1.delay)(500); // Small delay between logouts
        }
        this.logger.success('Todos os clientes desconectados');
    }
    // ============================================
    // VOICE OPERATIONS
    // ============================================
    /**
     * Joins a voice channel with a specific client
     */
    async joinVoice(clientId, channelId) {
        const client = this.clients.get(clientId);
        if (!client) {
            return this.createErrorReport(clientId, 'Cliente não encontrado');
        }
        if (!client.isReady()) {
            return this.createErrorReport(clientId, 'Cliente não está online', client.label);
        }
        const success = await client.voiceService.join(client.client, channelId);
        return {
            clientId,
            clientLabel: client.label,
            result: success ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
            message: success ? 'Entrou no canal de voz' : 'Falha ao entrar no canal'
        };
    }
    /**
     * Joins a voice channel with all clients sequentially
     */
    async joinVoiceAll(channelId) {
        this.logger.info(`Todos os clientes entrando no canal: ${channelId}`);
        const reports = [];
        let successful = 0;
        let failed = 0;
        let skipped = 0;
        for (const client of this.clients.values()) {
            if (!client.isReady()) {
                reports.push({
                    clientId: client.id,
                    clientLabel: client.label,
                    result: types_1.OperationResult.SKIPPED,
                    message: 'Cliente não está online'
                });
                skipped++;
                continue;
            }
            const success = await client.voiceService.join(client.client, channelId);
            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: success ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
                message: success ? 'Entrou no canal' : 'Falha ao entrar'
            });
            success ? successful++ : failed++;
            await (0, delay_1.delay)(this.config.delayBetweenAccounts);
        }
        return { totalClients: this.clients.size, successful, failed, skipped, reports };
    }
    /**
     * Leaves voice channel with a specific client
     */
    async leaveVoice(clientId, guildId) {
        const client = this.clients.get(clientId);
        if (!client) {
            return this.createErrorReport(clientId, 'Cliente não encontrado');
        }
        const success = await client.voiceService.leave(client.client, guildId);
        return {
            clientId,
            clientLabel: client.label,
            result: success ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
            message: success ? 'Saiu do canal de voz' : 'Falha ao sair do canal'
        };
    }
    /**
     * Leaves voice channel with all clients
     */
    async leaveVoiceAll(guildId) {
        this.logger.info('Todos os clientes saindo do canal de voz');
        const reports = [];
        let successful = 0;
        let failed = 0;
        for (const client of this.clients.values()) {
            const success = await client.voiceService.leave(client.client, guildId);
            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: success ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
                message: success ? 'Saiu do canal' : 'Falha ao sair'
            });
            success ? successful++ : failed++;
            await (0, delay_1.delay)(this.config.delayBetweenAccounts);
        }
        return { totalClients: this.clients.size, successful, failed, skipped: 0, reports };
    }
    // ============================================
    // DM OPERATIONS
    // ============================================
    /**
     * Cleans DM with a specific client
     */
    async cleanDM(clientId, userId) {
        const client = this.clients.get(clientId);
        if (!client) {
            return this.createErrorReport(clientId, 'Cliente não encontrado');
        }
        if (!client.isReady()) {
            return this.createErrorReport(clientId, 'Cliente não está online', client.label);
        }
        const deletedCount = await client.dmService.cleanDM(client.client, userId, this.config.delayBetweenOperations);
        return {
            clientId,
            clientLabel: client.label,
            result: deletedCount > 0 ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
            message: `Deletadas ${deletedCount} mensagens`,
            data: { deletedCount }
        };
    }
    /**
     * Cleans DM with all clients sequentially (RECOMMENDED approach)
     * This method respects rate limits and processes one account at a time
     */
    async cleanDMSequentially(userId) {
        this.logger.info(`Limpando DMs de todas as contas para usuário: ${userId}`);
        const reports = [];
        let successful = 0;
        let failed = 0;
        let skipped = 0;
        let totalDeleted = 0;
        for (const client of this.clients.values()) {
            if (!client.isReady()) {
                reports.push({
                    clientId: client.id,
                    clientLabel: client.label,
                    result: types_1.OperationResult.SKIPPED,
                    message: 'Cliente não está online'
                });
                skipped++;
                continue;
            }
            this.logger.info(`Processando: ${client.label}`);
            const deletedCount = await client.dmService.cleanDM(client.client, userId, this.config.delayBetweenOperations);
            totalDeleted += deletedCount;
            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: deletedCount > 0 ? types_1.OperationResult.SUCCESS : types_1.OperationResult.FAILURE,
                message: `Deletadas ${deletedCount} mensagens`,
                data: { deletedCount }
            });
            deletedCount > 0 ? successful++ : failed++;
            // Important: delay between accounts to avoid rate limits
            await (0, delay_1.delay)(this.config.delayBetweenAccounts);
        }
        this.logger.success(`Limpeza completa! Total deletado: ${totalDeleted} mensagens`);
        return {
            totalClients: this.clients.size,
            successful,
            failed,
            skipped,
            reports
        };
    }
    /**
     * Stops DM cleaning for a specific client
     */
    stopDMClean(clientId) {
        const client = this.clients.get(clientId);
        client?.dmService.stop();
    }
    /**
     * Stops DM cleaning for all clients
     */
    stopAllDMClean() {
        for (const client of this.clients.values()) {
            client.dmService.stop();
        }
        this.logger.warning('Todas as limpezas de DM foram paradas');
    }
    // ============================================
    // UTILITY METHODS
    // ============================================
    /**
     * Creates an error report for failed operations
     */
    createErrorReport(clientId, message, label) {
        return {
            clientId,
            clientLabel: label || 'Unknown',
            result: types_1.OperationResult.FAILURE,
            message
        };
    }
    /**
     * Gets status of all clients
     */
    getStatus() {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            label: client.label,
            status: client.status,
            username: client.username
        }));
    }
    /**
     * Destroys the manager and all clients
     */
    async destroy() {
        await this.logoutAll();
        this.clients.clear();
        this.logger.info('Manager destruído');
    }
}
exports.SelfbotManager = SelfbotManager;
// Singleton instance for global use
let managerInstance = null;
/**
 * Gets or creates the global SelfbotManager instance
 */
const getSelfbotManager = (config) => {
    if (!managerInstance) {
        managerInstance = new SelfbotManager(config);
    }
    return managerInstance;
};
exports.getSelfbotManager = getSelfbotManager;
/**
 * Creates a new SelfbotManager instance (non-singleton)
 */
const createSelfbotManager = (config) => {
    return new SelfbotManager(config);
};
exports.createSelfbotManager = createSelfbotManager;
