import { 
    ISelfbotManager,
    SelfbotConfig,
    ManagerConfig,
    DEFAULT_MANAGER_CONFIG,
    OperationResult,
    OperationReport,
    BatchOperationReport,
    ISelfbotClient
} from './types';
import { SelfbotClient, createSelfbotClient } from './SelfbotClient';
import { Logger } from './utils/Logger';
import { delay } from './utils/delay';

export class SelfbotManager implements ISelfbotManager {
    private clients: Map<string, SelfbotClient> = new Map();
    private readonly config: ManagerConfig;
    private readonly logger = Logger.child('[Manager]');

    constructor(config: Partial<ManagerConfig> = {}) {
        this.config = { ...DEFAULT_MANAGER_CONFIG, ...config };
    }

    addClient(config: SelfbotConfig): string {
        const client = createSelfbotClient(config);
        this.clients.set(client.id, client);
        this.logger.info(`Cliente adicionado: ${client.label} (${client.id})`);
        return client.id;
    }

    addClients(configs: SelfbotConfig[]): string[] {
        return configs.map(config => this.addClient(config));
    }

    removeClient(clientId: string): boolean {
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

    getClient(clientId: string): SelfbotClient | undefined {
        return this.clients.get(clientId);
    }

    getClientByIndex(index: number): SelfbotClient | undefined {
        const clientsArray = Array.from(this.clients.values());
        return clientsArray[index];
    }

    getAllClients(): ISelfbotClient[] {
        return Array.from(this.clients.values());
    }

    get clientCount(): number {
        return this.clients.size;
    }

    async loginAll(): Promise<BatchOperationReport> {
        this.logger.info(`Iniciando login de ${this.clients.size} clientes...`);
        
        const reports: OperationReport[] = [];
        let successful = 0;
        let failed = 0;

        for (const client of this.clients.values()) {
            const result = await client.login();
            
            const report: OperationReport = {
                clientId: client.id,
                clientLabel: client.label,
                result: result ? OperationResult.SUCCESS : OperationResult.FAILURE,
                message: result ? 'Login realizado com sucesso' : 'Falha no login'
            };
            
            reports.push(report);
            result ? successful++ : failed++;

            await delay(this.config.delayBetweenAccounts);
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

    async logoutAll(): Promise<void> {
        this.logger.info('Desconectando todos os clientes...');
        
        for (const client of this.clients.values()) {
            await client.logout();
            await delay(500);
        }

        this.logger.success('Todos os clientes desconectados');
    }

    async joinVoice(clientId: string, channelId: string): Promise<OperationReport> {
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
            result: success ? OperationResult.SUCCESS : OperationResult.FAILURE,
            message: success ? 'Entrou no canal de voz' : 'Falha ao entrar no canal'
        };
    }

    async joinVoiceAll(channelId: string): Promise<BatchOperationReport> {
        this.logger.info(`Todos os clientes entrando no canal: ${channelId}`);

        const reports: OperationReport[] = [];
        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const client of this.clients.values()) {
            if (!client.isReady()) {
                reports.push({
                    clientId: client.id,
                    clientLabel: client.label,
                    result: OperationResult.SKIPPED,
                    message: 'Cliente não está online'
                });
                skipped++;
                continue;
            }

            const success = await client.voiceService.join(client.client, channelId);
            
            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: success ? OperationResult.SUCCESS : OperationResult.FAILURE,
                message: success ? 'Entrou no canal' : 'Falha ao entrar'
            });

            success ? successful++ : failed++;
            await delay(this.config.delayBetweenAccounts);
        }

        return { totalClients: this.clients.size, successful, failed, skipped, reports };
    }

    async leaveVoice(clientId: string, guildId: string): Promise<OperationReport> {
        const client = this.clients.get(clientId);

        if (!client) {
            return this.createErrorReport(clientId, 'Cliente não encontrado');
        }

        const success = await client.voiceService.leave(client.client, guildId);

        return {
            clientId,
            clientLabel: client.label,
            result: success ? OperationResult.SUCCESS : OperationResult.FAILURE,
            message: success ? 'Saiu do canal de voz' : 'Falha ao sair do canal'
        };
    }

    async leaveVoiceAll(guildId: string): Promise<BatchOperationReport> {
        this.logger.info('Todos os clientes saindo do canal de voz');

        const reports: OperationReport[] = [];
        let successful = 0;
        let failed = 0;

        for (const client of this.clients.values()) {
            const success = await client.voiceService.leave(client.client, guildId);
            
            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: success ? OperationResult.SUCCESS : OperationResult.FAILURE,
                message: success ? 'Saiu do canal' : 'Falha ao sair'
            });

            success ? successful++ : failed++;
            await delay(this.config.delayBetweenAccounts);
        }

        return { totalClients: this.clients.size, successful, failed, skipped: 0, reports };
    }

    async cleanDM(clientId: string, userId: string): Promise<OperationReport> {
        const client = this.clients.get(clientId);

        if (!client) {
            return this.createErrorReport(clientId, 'Cliente não encontrado');
        }

        if (!client.isReady()) {
            return this.createErrorReport(clientId, 'Cliente não está online', client.label);
        }

        const deletedCount = await client.dmService.cleanDM(
            client.client, 
            userId, 
            this.config.delayBetweenOperations
        );

        return {
            clientId,
            clientLabel: client.label,
            result: deletedCount > 0 ? OperationResult.SUCCESS : OperationResult.FAILURE,
            message: `Deletadas ${deletedCount} mensagens`,
            data: { deletedCount }
        };
    }

    async cleanDMSequentially(userId: string): Promise<BatchOperationReport> {
        this.logger.info(`Limpando DMs de todas as contas para usuário: ${userId}`);

        const reports: OperationReport[] = [];
        let successful = 0;
        let failed = 0;
        let skipped = 0;
        let totalDeleted = 0;

        for (const client of this.clients.values()) {
            if (!client.isReady()) {
                reports.push({
                    clientId: client.id,
                    clientLabel: client.label,
                    result: OperationResult.SKIPPED,
                    message: 'Cliente não está online'
                });
                skipped++;
                continue;
            }

            this.logger.info(`Processando: ${client.label}`);

            const deletedCount = await client.dmService.cleanDM(
                client.client,
                userId,
                this.config.delayBetweenOperations
            );

            totalDeleted += deletedCount;

            reports.push({
                clientId: client.id,
                clientLabel: client.label,
                result: deletedCount > 0 ? OperationResult.SUCCESS : OperationResult.FAILURE,
                message: `Deletadas ${deletedCount} mensagens`,
                data: { deletedCount }
            });

            deletedCount > 0 ? successful++ : failed++;

            await delay(this.config.delayBetweenAccounts);
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

    stopDMClean(clientId: string): void {
        const client = this.clients.get(clientId);
        client?.dmService.stop();
    }

    stopAllDMClean(): void {
        for (const client of this.clients.values()) {
            client.dmService.stop();
        }
        this.logger.warning('Todas as limpezas de DM foram paradas');
    }

    private createErrorReport(clientId: string, message: string, label?: string): OperationReport {
        return {
            clientId,
            clientLabel: label || 'Unknown',
            result: OperationResult.FAILURE,
            message
        };
    }

    getStatus(): { id: string; label: string; status: string; username: string | null }[] {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            label: client.label,
            status: client.status,
            username: client.username
        }));
    }

    async destroy(): Promise<void> {
        await this.logoutAll();
        this.clients.clear();
        this.logger.info('Manager destruído');
    }
}

let managerInstance: SelfbotManager | null = null;

export const getSelfbotManager = (config?: Partial<ManagerConfig>): SelfbotManager => {
    if (!managerInstance) {
        managerInstance = new SelfbotManager(config);
    }
    return managerInstance;
};

export const createSelfbotManager = (config?: Partial<ManagerConfig>): SelfbotManager => {
    return new SelfbotManager(config);
};
