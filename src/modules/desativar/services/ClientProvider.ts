import { getClientService } from '../../../lib/selfbot';
import { SelfbotClient } from '../../../lib/selfbot';
import { IClientProvider } from '../types';

export class ClientProvider implements IClientProvider {
    private readonly clientService = getClientService();

    async getClient(userId: string): Promise<SelfbotClient | null> {
        return this.clientService.getExistingClient(userId);
    }
}

export const createClientProvider = (): ClientProvider => {
    return new ClientProvider();
};
