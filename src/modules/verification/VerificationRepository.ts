import { VerificationRequest, VerificationStatus } from './types';

const COOLDOWN_MS = 10 * 60 * 1000;

export class VerificationRepository {
    private requests: Map<string, VerificationRequest> = new Map();
    private messageToRequest: Map<string, string> = new Map();
    private cooldowns: Map<string, number> = new Map();

    create(request: VerificationRequest): void {
        this.requests.set(request.id, request);
        this.cooldowns.set(request.requesterId, Date.now());
    }

    getCooldownRemaining(userId: string): number {
        const lastRequest = this.cooldowns.get(userId);
        if (!lastRequest) return 0;

        const elapsed = Date.now() - lastRequest;
        const remaining = COOLDOWN_MS - elapsed;

        return remaining > 0 ? remaining : 0;
    }

    getCooldownMinutes(userId: string): number {
        return Math.ceil(this.getCooldownRemaining(userId) / 60000);
    }

    isOnCooldown(userId: string): boolean {
        return this.getCooldownRemaining(userId) > 0;
    }

    clearCooldown(userId: string): void {
        this.cooldowns.delete(userId);
    }

    getById(id: string): VerificationRequest | undefined {
        return this.requests.get(id);
    }

    getByMessageId(messageId: string): VerificationRequest | undefined {
        const requestId = this.messageToRequest.get(messageId);
        if (!requestId) return undefined;
        return this.requests.get(requestId);
    }

    linkMessageToRequest(messageId: string, requestId: string): void {
        this.messageToRequest.set(messageId, requestId);
    }

    updateStatus(
        id: string,
        status: VerificationStatus,
        resolvedById: string,
        resolvedByUsername: string
    ): boolean {
        const request = this.requests.get(id);
        if (!request) return false;

        request.status = status;
        request.resolvedAt = new Date();
        request.resolvedById = resolvedById;
        request.resolvedByUsername = resolvedByUsername;

        this.requests.set(id, request);

        if (status === 'rejected') {
            this.clearCooldown(request.requesterId);
        }

        return true;
    }

    getPendingByRequester(requesterId: string): VerificationRequest | undefined {
        for (const request of this.requests.values()) {
            if (request.requesterId === requesterId && request.status === 'pending') {
                return request;
            }
        }
        return undefined;
    }

    delete(id: string): boolean {
        return this.requests.delete(id);
    }

    generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

export const verificationRepository = new VerificationRepository();
