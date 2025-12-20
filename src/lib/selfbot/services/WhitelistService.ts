import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { Logger } from '../utils/Logger';
import { getNotificationService } from './NotificationService';

interface WhitelistStore {
    [discordUserId: string]: string[];
}

const WHITELIST_FILE = join(process.cwd(), 'src/data/whitelist.json');

export class WhitelistService {
    private readonly logger = Logger.child('[Whitelist]');
    private store: WhitelistStore = {};

    constructor() {
        this.loadStore();
    }

    private loadStore(): void {
        try {
            if (existsSync(WHITELIST_FILE)) {
                const data = readFileSync(WHITELIST_FILE, 'utf-8');
                this.store = JSON.parse(data);
                this.logger.success('Whitelist carregada');
            } else {
                this.store = {};
                this.saveStore();
            }
        } catch (error) {
            this.logger.error(`Erro ao carregar whitelist: ${error}`);
            this.store = {};
        }
    }

    private saveStore(): void {
        try {
            const dir = dirname(WHITELIST_FILE);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            writeFileSync(WHITELIST_FILE, JSON.stringify(this.store, null, 2));
        } catch (error) {
            this.logger.error(`Erro ao salvar whitelist: ${error}`);
        }
    }

    private ensureUserList(userId: string): void {
        if (!this.store[userId]) {
            this.store[userId] = [];
        }
    }

    addId(userId: string, targetId: string): boolean {
        this.ensureUserList(userId);

        if (this.store[userId].includes(targetId)) {
            return false;
        }

        this.store[userId].push(targetId);
        this.saveStore();
        this.logger.info(`ID ${targetId} adicionado à whitelist de ${userId}`);
        getNotificationService().notifyWhitelistAdd(userId, targetId);
        
        return true;
    }

    removeId(userId: string, targetId: string): boolean {
        this.ensureUserList(userId);

        const index = this.store[userId].indexOf(targetId);
        if (index === -1) {
            return false;
        }

        this.store[userId].splice(index, 1);
        this.saveStore();
        this.logger.info(`ID ${targetId} removido da whitelist de ${userId}`);
        getNotificationService().notifyWhitelistRemove(userId, targetId);
        
        return true;
    }

    getWhitelist(userId: string): string[] {
        return this.store[userId] || [];
    }

    isWhitelisted(userId: string, targetId: string): boolean {
        return this.getWhitelist(userId).includes(targetId);
    }

    getCount(userId: string): number {
        return this.getWhitelist(userId).length;
    }

    clearWhitelist(userId: string): void {
        this.store[userId] = [];
        this.saveStore();
        this.logger.info(`Whitelist de ${userId} limpa`);
    }
}

let whitelistServiceInstance: WhitelistService | null = null;

export const getWhitelistService = (): WhitelistService => {
    if (!whitelistServiceInstance) {
        whitelistServiceInstance = new WhitelistService();
    }
    return whitelistServiceInstance;
};

export const createWhitelistService = (): WhitelistService => new WhitelistService();

