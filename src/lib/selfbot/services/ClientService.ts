import { getSelfbotManager, SelfbotManager } from '../SelfbotManager';
import { SelfbotClient } from '../SelfbotClient';
import { getTokenService, TokenService } from './TokenService';

export interface IClientService {
    ensureClient(userId: string, username: string): Promise<SelfbotClient | null>;
    getExistingClient(userId: string): SelfbotClient | null;
    hasToken(userId: string): boolean;
}

interface ClientServiceDependencies {
    readonly tokenService: TokenService;
    readonly manager: SelfbotManager;
}

export class ClientService implements IClientService {
    private readonly tokenService: TokenService;
    private readonly manager: SelfbotManager;

    constructor(dependencies?: Partial<ClientServiceDependencies>) {
        this.tokenService = dependencies?.tokenService ?? getTokenService();
        this.manager = dependencies?.manager ?? getSelfbotManager();
    }

    async ensureClient(userId: string, username: string): Promise<SelfbotClient | null> {
        const userData = this.tokenService.getUserToken(userId);
        
        if (!this.hasValidToken(userData)) {
            return null;
        }
        
        const existingClient = this.findReadyClient(userData!.selfbotClientId);
        if (existingClient) {
            return existingClient;
        }
        
        return this.createAndLoginClient(userId, username, userData!.token);
    }

    getExistingClient(userId: string): SelfbotClient | null {
        const userData = this.tokenService.getUserToken(userId);
        
        if (!this.hasValidTokenAndClientId(userData)) {
            return null;
        }
        
        return this.getReadyClient(userData!.selfbotClientId!);
    }

    hasToken(userId: string): boolean {
        return this.tokenService.hasToken(userId);
    }

    private hasValidToken(userData: ReturnType<TokenService['getUserToken']>): userData is NonNullable<typeof userData> {
        return !!userData?.token;
    }

    private hasValidTokenAndClientId(userData: ReturnType<TokenService['getUserToken']>): boolean {
        return !!(userData?.token && userData.selfbotClientId);
    }

    private findReadyClient(clientId?: string | null): SelfbotClient | null {
        if (!clientId) {
            return null;
        }

        const client = this.manager.getClient(clientId);
        
        if (this.isClientReady(client)) {
            return client;
        }
        
        this.removeStaleClient(client, clientId);
        return null;
    }

    private getReadyClient(clientId: string): SelfbotClient | null {
        const client = this.manager.getClient(clientId);
        return this.isClientReady(client) ? client : null;
    }

    private isClientReady(client: SelfbotClient | undefined): client is SelfbotClient {
        return !!client?.isReady();
    }

    private removeStaleClient(client: SelfbotClient | undefined, clientId: string): void {
        if (client) {
            this.manager.removeClient(clientId);
        }
    }

    private async createAndLoginClient(
        userId: string, 
        username: string, 
        token: string
    ): Promise<SelfbotClient | null> {
        const clientId = this.registerNewClient(userId, username, token);
        const client = this.manager.getClient(clientId);
        
        if (!client) {
            return null;
        }
        
        return this.attemptLogin(client, clientId, userId);
    }

    private registerNewClient(userId: string, username: string, token: string): string {
        const label = this.generateLabel(username, userId);
        const clientId = this.manager.addClient({ token, label });
        this.tokenService.updateSelfbotClientId(userId, clientId);
        return clientId;
    }

    private async attemptLogin(
        client: SelfbotClient, 
        clientId: string, 
        userId: string
    ): Promise<SelfbotClient | null> {
        const loginSuccess = await client.login();
        
        if (loginSuccess) {
            return client;
        }
        
        this.cleanupFailedClient(clientId, userId);
        return null;
    }

    private generateLabel(username: string, userId: string): string {
        return `${username}-${userId.slice(-4)}`;
    }

    private cleanupFailedClient(clientId: string, userId: string): void {
        this.manager.removeClient(clientId);
        this.tokenService.updateSelfbotClientId(userId, '');
    }
}

let instance: ClientService | null = null;

export const getClientService = (): ClientService => {
    if (!instance) {
        instance = new ClientService();
    }
    return instance;
};

export const createClientService = (dependencies?: Partial<ClientServiceDependencies>): ClientService => {
    return new ClientService(dependencies);
};
