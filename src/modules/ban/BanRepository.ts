import { JsonRepository } from '../../shared/repositories/JsonRepository';
import { BlacklistEntry } from './types';

interface BlacklistData {
    [odId: string]: BlacklistEntry;
}

export class BanRepository {
    private repository: JsonRepository<BlacklistData>;

    constructor() {
        this.repository = new JsonRepository<BlacklistData>('blacklist.json');
    }

    addToBlacklist(entry: BlacklistEntry): void {
        this.repository.set(entry.odId, entry);
    }

    removeFromBlacklist(odId: string): boolean {
        const entry = this.repository.get(odId);
        if (!entry) return false;

        this.repository.delete(odId);
        return true;
    }

    isBlacklisted(odId: string): boolean {
        return !!this.repository.get(odId);
    }

    getBlacklistEntry(odId: string): BlacklistEntry | undefined {
        return this.repository.get(odId) as BlacklistEntry | undefined;
    }

    getAllBlacklisted(): BlacklistEntry[] {
        const data = this.repository.getAll();
        return Object.values(data);
    }

    getBlacklistCount(): number {
        return this.getAllBlacklisted().length;
    }
}

export const banRepository = new BanRepository();

