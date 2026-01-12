import { JsonRepository } from '../../shared/repositories/JsonRepository';

export interface MvpData {
    odiscordUserId: string;
    username: string;
    totalMvps: number;
}

type MvpDataRecord = Record<string, MvpData>;
export type MvpType = 'normal' | 'feminino';

export class MvpRepository {
    private repository: JsonRepository<MvpDataRecord>;
    private repositoryFeminino: JsonRepository<MvpDataRecord>;

    constructor() {
        this.repository = new JsonRepository<MvpDataRecord>('mvp.json');
        this.repositoryFeminino = new JsonRepository<MvpDataRecord>('mvp_feminino.json');
    }

    private getRepo(type: MvpType = 'normal'): JsonRepository<MvpDataRecord> {
        return type === 'feminino' ? this.repositoryFeminino : this.repository;
    }

    getAll(type: MvpType = 'normal'): MvpDataRecord {
        return this.getRepo(type).getAll();
    }

    get(userId: string, type: MvpType = 'normal'): MvpData | undefined {
        return this.getRepo(type).get(userId) as MvpData | undefined;
    }

    addMvp(userId: string, username: string, type: MvpType = 'normal'): number {
        const current = this.get(userId, type);
        const newTotal = (current?.totalMvps || 0) + 1;

        this.getRepo(type).set(userId, {
            odiscordUserId: userId,
            username: username,
            totalMvps: newTotal,
        });

        return newTotal;
    }

    getTopRanking(limit: number = 10, type: MvpType = 'normal'): MvpData[] {
        const data = this.getAll(type);
        return Object.values(data)
            .sort((a, b) => b.totalMvps - a.totalMvps)
            .slice(0, limit);
    }

    getTop10UserIds(type: MvpType = 'normal'): string[] {
        return this.getTopRanking(10, type).map(mvp => mvp.odiscordUserId);
    }
}

