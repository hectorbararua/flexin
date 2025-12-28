import { JsonRepository } from '../../shared/repositories/JsonRepository';
import { Platform, Profile, ProfileData } from './types';

export class ProfileRepository {
    private repository: JsonRepository<ProfileData>;

    constructor() {
        this.repository = new JsonRepository<ProfileData>('profiles.json');
    }

    getAll(): ProfileData {
        return this.repository.getAll();
    }

    getByUser(discordId: string): Profile[] {
        return (this.repository.get(discordId) as Profile[] | undefined) || [];
    }

    getByPlatform(discordId: string, platform: Platform): Profile | undefined {
        const profiles = this.getByUser(discordId);
        return profiles.find(p => p.platform === platform);
    }

    exists(discordId: string, platform: Platform): boolean {
        return !!this.getByPlatform(discordId, platform);
    }

    add(discordId: string, platform: Platform, profileUrl: string, username: string): Profile {
        const profiles = this.getByUser(discordId);
        
        const existingIndex = profiles.findIndex(p => p.platform === platform);
        if (existingIndex !== -1) {
            profiles.splice(existingIndex, 1);
        }

        const profile: Profile = {
            discordId,
            platform,
            profileUrl,
            username,
            addedAt: new Date().toISOString(),
        };

        profiles.push(profile);
        this.repository.set(discordId, profiles as unknown as ProfileData[keyof ProfileData]);
        return profile;
    }

    remove(discordId: string, platform: Platform): boolean {
        const profiles = this.getByUser(discordId);
        const index = profiles.findIndex(p => p.platform === platform);
        
        if (index === -1) {
            return false;
        }

        profiles.splice(index, 1);
        
        if (profiles.length === 0) {
            this.repository.delete(discordId);
        } else {
            this.repository.set(discordId, profiles as unknown as ProfileData[keyof ProfileData]);
        }
        
        return true;
    }

    removeAllByUser(discordId: string): void {
        this.repository.delete(discordId);
    }

    findByProfileUrl(profileUrl: string): Profile | undefined {
        const allProfiles = this.getAll();
        
        for (const profiles of Object.values(allProfiles)) {
            const found = (profiles as Profile[]).find(p => 
                this.normalizeUrl(p.profileUrl) === this.normalizeUrl(profileUrl)
            );
            if (found) return found;
        }
        
        return undefined;
    }

    isVideoFromRegisteredProfile(discordId: string, videoUrl: string, platform: Platform): boolean {
        const profile = this.getByPlatform(discordId, platform);
        if (!profile) return false;

        if (platform === 'youtube') {
            return true;
        }

        const profileUsername = this.extractUsername(profile.profileUrl, platform);
        const videoUsername = this.extractUsernameFromVideo(videoUrl, platform);

        if (!profileUsername || !videoUsername) return false;

        return profileUsername.toLowerCase() === videoUsername.toLowerCase();
    }

    private normalizeUrl(url: string): string {
        return url.toLowerCase().replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, '');
    }

    private extractUsername(profileUrl: string, platform: Platform): string | null {
        const cleanUrl = profileUrl.split('?')[0];
        
        if (platform === 'roblox') {
            return 'roblox';
        }
        
        const patterns: Record<Platform, RegExp> = {
            tiktok: /@([\w.-]+)/,
            youtube: /(?:@|channel\/|c\/)([\w.-]+)/,
            roblox: /roblox\.com/,
        };

        const match = cleanUrl.match(patterns[platform]);
        return match ? match[1] : null;
    }

    private extractUsernameFromVideo(videoUrl: string, platform: Platform): string | null {
        const cleanUrl = videoUrl.split('?')[0];
        
        if (platform === 'roblox') {
            return null;
        }
        
        const patterns: Record<Platform, RegExp> = {
            tiktok: /@([\w.-]+)/,
            youtube: /(?:@|channel\/)([\w.-]+)/,
            roblox: /roblox\.com/,
        };

        const match = cleanUrl.match(patterns[platform]);
        return match ? match[1] : null;
    }
}

export const profileRepository = new ProfileRepository();
