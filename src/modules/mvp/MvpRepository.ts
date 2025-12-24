import { JsonRepository } from '../../shared/repositories/JsonRepository';

export interface MvpData {
    odiscordUserId: string;
    username: string;
    totalMvps: number;
}

type MvpDataRecord = Record<string, MvpData>;

export class MvpRepository {
    private repository: JsonRepository<MvpDataRecord>;

    constructor() {
        this.repository = new JsonRepository<MvpDataRecord>('mvp.json');
    }

    getAll(): MvpDataRecord {
        return this.repository.getAll();
    }

    get(userId: string): MvpData | undefined {
        return this.repository.get(userId) as MvpData | undefined;
    }

    addMvp(userId: string, username: string): number {
        const current = this.get(userId);
        const newTotal = (current?.totalMvps || 0) + 1;

        this.repository.set(userId, {
            odiscordUserId: userId,
            username: username,
            totalMvps: newTotal,
        });

        return newTotal;
    }

    getTopRanking(limit: number = 10): MvpData[] {
        const data = this.getAll();
        return Object.values(data)
            .sort((a, b) => b.totalMvps - a.totalMvps)
            .slice(0, limit);
    }

    getTop10UserIds(): string[] {
        return this.getTopRanking(10).map(mvp => mvp.odiscordUserId);
    }
}

