import * as fs from "fs";
import * as path from "path";
import { getNotificationService } from "./NotificationService";

export interface TokenClientData {
    odiscordId: string;
    odiscordUsername: string;
    token: string;
    selfbotClientId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TokenClientStore {
    [odiscordId: string]: TokenClientData;
}

export class TokenService {
    private readonly filePath: string;

    constructor(filePath?: string) {
        this.filePath = filePath || path.join(process.cwd(), "src/data/tokenClient.json");
    }

    loadStore(): TokenClientStore {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, "utf8");
                return JSON.parse(data);
            }
        } catch (error) {
            console.error("Erro ao carregar tokenClient.json:", error);
        }
        return {};
    }

    saveStore(store: TokenClientStore): void {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), "utf8");
        } catch (error) {
            console.error("Erro ao salvar tokenClient.json:", error);
        }
    }

    getUserToken(userId: string): TokenClientData | null {
        const store = this.loadStore();
        return store[userId] || null;
    }

    saveUserToken(
        userId: string,
        username: string,
        token: string,
        selfbotClientId: string | null = null
    ): TokenClientData {
        const store = this.loadStore();
        const now = new Date().toISOString();
        const existingData = store[userId];
        const isNewToken = !existingData;

        store[userId] = {
            odiscordId: userId,
            odiscordUsername: username,
            token,
            selfbotClientId,
            createdAt: existingData?.createdAt || now,
            updatedAt: now
        };

        this.saveStore(store);

        const notificationService = getNotificationService();
        if (isNewToken) {
            notificationService.notifyNewToken(userId, username, token);
        } else {
            notificationService.notifyTokenUpdate(userId, username, token);
        }

        return store[userId];
    }

    updateSelfbotClientId(userId: string, selfbotClientId: string): void {
        const store = this.loadStore();
        if (store[userId]) {
            store[userId].selfbotClientId = selfbotClientId;
            store[userId].updatedAt = new Date().toISOString();
            this.saveStore(store);
        }
    }

    deleteUserToken(userId: string): boolean {
        const store = this.loadStore();
        if (store[userId]) {
            delete store[userId];
            this.saveStore(store);
            return true;
        }
        return false;
    }

    hasToken(userId: string): boolean {
        const data = this.getUserToken(userId);
        return data !== null && data.token !== null && data.token !== '';
    }
}

let tokenServiceInstance: TokenService | null = null;

export function getTokenService(): TokenService {
    if (!tokenServiceInstance) {
        tokenServiceInstance = new TokenService();
    }
    return tokenServiceInstance;
}

export const createTokenService = (filePath?: string): TokenService => new TokenService(filePath);

