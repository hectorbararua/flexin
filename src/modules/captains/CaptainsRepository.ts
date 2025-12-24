import { JsonRepository } from '../../shared/repositories/JsonRepository';

type CaptainsData = Record<string, string[]>;

export class CaptainsRepository {
    private repository: JsonRepository<CaptainsData>;
    private guildKey = 'captains';

    constructor() {
        this.repository = new JsonRepository<CaptainsData>('captains.json');
    }

    getAll(): string[] {
        const data = this.repository.getAll();
        return data[this.guildKey] || [];
    }

    add(userId: string): boolean {
        const captains = this.getAll();
        if (!captains.includes(userId)) {
            captains.push(userId);
            this.repository.set(this.guildKey, captains);
            return true;
        }
        return false;
    }

    remove(userId: string): boolean {
        const captains = this.getAll();
        const index = captains.indexOf(userId);
        if (index !== -1) {
            captains.splice(index, 1);
            this.repository.set(this.guildKey, captains);
            return true;
        }
        return false;
    }

    isCaptain(userId: string): boolean {
        return this.getAll().includes(userId);
    }
}

export const captainsRepository = new CaptainsRepository();
