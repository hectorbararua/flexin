import { JsonRepository } from '../../shared/repositories/JsonRepository';

export type RankingData = Record<string, number>;

export class RankingRepository {
    private repository: JsonRepository<RankingData>;

    constructor() {
        this.repository = new JsonRepository<RankingData>('ranking.json');
    }

    getAll(): RankingData {
        return this.repository.getAll();
    }

    getPoints(userId: string): number {
        return this.repository.get(userId) as number || 0;
    }

    addPoints(userId: string, points: number): void {
        const currentPoints = this.getPoints(userId);
        this.repository.set(userId, currentPoints + points);
    }

    setPoints(userId: string, points: number): void {
        this.repository.set(userId, points);
    }

    getSortedRanking(): Array<{ userId: string; points: number }> {
        const data = this.getAll();
        return Object.entries(data)
            .map(([userId, points]) => ({ userId, points: points as number }))
            .sort((a, b) => b.points - a.points);
    }
}

