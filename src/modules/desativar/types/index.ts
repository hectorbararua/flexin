import { SelfbotClient } from '../../../lib/selfbot';

export interface DeactivateResult {
    readonly success: boolean;
    readonly error?: string;
}

export interface IClientProvider {
    getClient(userId: string): Promise<SelfbotClient | null>;
}

export interface IActivityDeactivator {
    deactivate(userId: string): Promise<DeactivateResult>;
}

