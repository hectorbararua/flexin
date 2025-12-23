import { ClientProvider, createClientProvider } from './ClientProvider';
import { IActivityDeactivator, DeactivateResult } from '../types';

export class ActivityDeactivator implements IActivityDeactivator {
    private readonly clientProvider: ClientProvider;

    constructor(clientProvider?: ClientProvider) {
        this.clientProvider = clientProvider ?? createClientProvider();
    }

    async deactivate(userId: string): Promise<DeactivateResult> {
        const client = await this.clientProvider.getClient(userId);
        
        if (!client) {
            return { success: false, error: 'not_online' };
        }
        
        const success = client.activityService.clearActivity(client.client);
        
        return { success };
    }
}

export const createActivityDeactivator = (): ActivityDeactivator => {
    return new ActivityDeactivator();
};

