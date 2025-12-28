import { JsonRepository } from '../../shared/repositories/JsonRepository';
import { Influencer, InfluencerData } from './types';

export class InfluencerRepository {
    private repository: JsonRepository<InfluencerData>;

    constructor() {
        this.repository = new JsonRepository<InfluencerData>('influencers.json');
    }

    getAll(): InfluencerData {
        return this.repository.getAll();
    }

    get(discordId: string): Influencer | undefined {
        return this.repository.get(discordId) as Influencer | undefined;
    }

    exists(discordId: string): boolean {
        return !!this.get(discordId);
    }

    add(discordId: string, addedBy: string): Influencer {
        const influencer: Influencer = {
            discordId,
            addedBy,
            addedAt: new Date().toISOString(),
        };
        this.repository.set(discordId, influencer as unknown as InfluencerData[keyof InfluencerData]);
        return influencer;
    }

    remove(discordId: string): boolean {
        if (!this.exists(discordId)) {
            return false;
        }
        this.repository.delete(discordId);
        return true;
    }

    count(): number {
        return Object.keys(this.getAll()).length;
    }

    getAllIds(): string[] {
        return Object.keys(this.getAll());
    }
}

export const influencerRepository = new InfluencerRepository();

