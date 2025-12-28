import { Guild, GuildMember } from 'discord.js';
import { InfluencerRepository, influencerRepository } from './InfluencerRepository';
import { ProfileRepository, profileRepository } from './ProfileRepository';
import { INFLUENCER_ROLE_IDS, PLATFORM_ROLE_IDS } from './constants';
import { Influencer, Platform, Profile } from './types';

export class InfluencerService {
    constructor(
        private influencerRepo: InfluencerRepository = influencerRepository,
        private profileRepo: ProfileRepository = profileRepository
    ) {}

    async addInfluencer(
        discordId: string, 
        addedBy: string, 
        guild: Guild
    ): Promise<{ success: boolean; message: string; influencer?: Influencer }> {
        if (this.influencerRepo.exists(discordId)) {
            return { success: false, message: 'Este usuário já é um influencer.' };
        }

        const influencer = this.influencerRepo.add(discordId, addedBy);

        try {
            const member = await guild.members.fetch(discordId);
            await member.roles.add(INFLUENCER_ROLE_IDS.INFLUENCER);
            
            return { 
                success: true, 
                message: `Influencer adicionado com sucesso!`, 
                influencer 
            };
        } catch (error) {
            console.error('Error adding influencer role:', error);
            this.influencerRepo.remove(discordId);
            return { success: false, message: 'Erro ao adicionar o cargo de influencer.' };
        }
    }

    async removeInfluencer(
        discordId: string, 
        guild: Guild
    ): Promise<{ success: boolean; message: string }> {
        if (!this.influencerRepo.exists(discordId)) {
            return { success: false, message: 'Este usuário não é um influencer.' };
        }

        await this.removeAllPlatformRoles(discordId, guild);

        try {
            const member = await guild.members.fetch(discordId);
            await member.roles.remove(INFLUENCER_ROLE_IDS.INFLUENCER);
        } catch {}

        this.profileRepo.removeAllByUser(discordId);
        this.influencerRepo.remove(discordId);

        return { success: true, message: 'Influencer removido com sucesso!' };
    }

    isInfluencer(discordId: string): boolean {
        return this.influencerRepo.exists(discordId);
    }

    getInfluencer(discordId: string): Influencer | undefined {
        return this.influencerRepo.get(discordId);
    }

    getAllInfluencers(): Influencer[] {
        const data = this.influencerRepo.getAll();
        return Object.values(data);
    }

    getInfluencerCount(): number {
        return this.influencerRepo.count();
    }

    async handleUnauthorizedRoleAssignment(member: GuildMember): Promise<boolean> {
        const hasInfluencerRole = member.roles.cache.has(INFLUENCER_ROLE_IDS.INFLUENCER);
        const isRegistered = this.influencerRepo.exists(member.id);

        if (hasInfluencerRole && !isRegistered) {
            try {
                await member.roles.remove(INFLUENCER_ROLE_IDS.INFLUENCER);
                console.log(`Removed unauthorized influencer role from ${member.user.tag}`);
                return true;
            } catch (error) {
                console.error('Error removing unauthorized role:', error);
            }
        }

        return false;
    }

    async syncInfluencerRole(discordId: string, guild: Guild): Promise<void> {
        const isRegistered = this.influencerRepo.exists(discordId);

        try {
            const member = await guild.members.fetch(discordId);
            const hasRole = member.roles.cache.has(INFLUENCER_ROLE_IDS.INFLUENCER);

            if (isRegistered && !hasRole) {
                await member.roles.add(INFLUENCER_ROLE_IDS.INFLUENCER);
            } else if (!isRegistered && hasRole) {
                await member.roles.remove(INFLUENCER_ROLE_IDS.INFLUENCER);
            }
        } catch {}
    }

    async addProfile(
        discordId: string, 
        platform: Platform, 
        profileUrl: string, 
        username: string,
        guild: Guild
    ): Promise<Profile> {
        const profile = this.profileRepo.add(discordId, platform, profileUrl, username);
        await this.addPlatformRole(discordId, platform, guild);
        return profile;
    }

    async removeProfile(discordId: string, platform: Platform, guild: Guild): Promise<boolean> {
        const removed = this.profileRepo.remove(discordId, platform);
        
        if (removed) {
            await this.removePlatformRole(discordId, platform, guild);
        }
        
        return removed;
    }

    getProfiles(discordId: string): Profile[] {
        return this.profileRepo.getByUser(discordId);
    }

    getProfile(discordId: string, platform: Platform): Profile | undefined {
        return this.profileRepo.getByPlatform(discordId, platform);
    }

    hasProfile(discordId: string, platform: Platform): boolean {
        return this.profileRepo.exists(discordId, platform);
    }

    private async addPlatformRole(discordId: string, platform: Platform, guild: Guild): Promise<void> {
        const roleId = PLATFORM_ROLE_IDS[platform];
        if (!roleId) return;

        try {
            const member = await guild.members.fetch(discordId);
            await member.roles.add(roleId);
            console.log(`Added ${platform} role to ${member.user.tag}`);
        } catch (error) {
            console.error(`Error adding ${platform} role:`, error);
        }
    }

    private async removePlatformRole(discordId: string, platform: Platform, guild: Guild): Promise<void> {
        const roleId = PLATFORM_ROLE_IDS[platform];
        if (!roleId) return;

        try {
            const member = await guild.members.fetch(discordId);
            await member.roles.remove(roleId);
            console.log(`Removed ${platform} role from ${member.user.tag}`);
        } catch (error) {
            console.error(`Error removing ${platform} role:`, error);
        }
    }

    async removeAllPlatformRoles(discordId: string, guild: Guild): Promise<void> {
        const allPlatforms: Platform[] = ['tiktok', 'youtube'];
        
        for (const platform of allPlatforms) {
            await this.removePlatformRole(discordId, platform, guild);
        }
    }
}

export const influencerService = new InfluencerService();
