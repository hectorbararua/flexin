import { JsonRepository } from '../../shared/repositories/JsonRepository';

export type RankingData = Record<string, number>;
export type RankingType = 'normal' | 'feminino';

export class RankingRepository {
    private repository: JsonRepository<RankingData>;
    private repositoryFeminino: JsonRepository<RankingData>;

    constructor() {
        this.repository = new JsonRepository<RankingData>('ranking.json');
        this.repositoryFeminino = new JsonRepository<RankingData>('ranking_feminino.json');
    }

    private getRepo(type: RankingType = 'normal'): JsonRepository<RankingData> {
        return type === 'feminino' ? this.repositoryFeminino : this.repository;
    }

    getAll(type: RankingType = 'normal'): RankingData {
        return this.getRepo(type).getAll();
    }

    getPoints(userId: string, type: RankingType = 'normal'): number {
        return this.getRepo(type).get(userId) as number || 0;
    }

    addPoints(userId: string, points: number, type: RankingType = 'normal'): void {
        const currentPoints = this.getPoints(userId, type);
        this.getRepo(type).set(userId, currentPoints + points);
    }

    setPoints(userId: string, points: number, type: RankingType = 'normal'): void {
        this.getRepo(type).set(userId, points);
    }

    getSortedRanking(type: RankingType = 'normal'): Array<{ userId: string; points: number }> {
        const data = this.getAll(type);
        return Object.entries(data)
            .map(([userId, points]) => ({ userId, points: points as number }))
            .sort((a, b) => b.points - a.points);
    }
}

