import fs from 'fs';
import path from 'path';

interface GuildConfig {
    mainGuildId: string;
}

interface WelcomeChannels {
    welcomeChannelId: string;
    goodbyeChannelId: string;
    logChannelId: string;
}

interface VerificationChannels {
    verificationChannelId: string;
    approvalChannelId: string;
    logChannelId: string;
}

interface BanChannels {
    logChannelId: string;
    blacklistLogChannelId: string;
}

interface InfluencerChannels {
    tiktokChannelId: string;
    youtubeChannelId: string;
}

interface RankingChannels {
    rankingMvpChannelId: string;
    treinoResumoChannelId: string;
}

interface ChannelsConfig {
    guild: GuildConfig;
    welcome: WelcomeChannels;
    verification: VerificationChannels;
    ban: BanChannels;
    influencer: InfluencerChannels;
    ranking: RankingChannels;
}

export class ChannelConfigService {
    private filePath: string;
    private config: ChannelsConfig;

    constructor() {
        this.filePath = path.join(process.cwd(), 'src', 'config', 'channels.json');
        this.config = this.load();
    }

    private load(): ChannelsConfig {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data) as ChannelsConfig;
    }

    private save(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 4));
    }

    reload(): void {
        this.config = this.load();
    }

    get guild(): GuildConfig {
        return this.config.guild;
    }

    get welcome(): WelcomeChannels {
        return this.config.welcome;
    }

    get verification(): VerificationChannels {
        return this.config.verification;
    }

    get ban(): BanChannels {
        return this.config.ban;
    }

    get influencer(): InfluencerChannels {
        return this.config.influencer;
    }

    get ranking(): RankingChannels {
        return this.config.ranking;
    }

    getAllConfiguredChannelIds(): string[] {
        const ids: string[] = [];

        if (this.config.welcome.welcomeChannelId) ids.push(this.config.welcome.welcomeChannelId);
        if (this.config.welcome.goodbyeChannelId) ids.push(this.config.welcome.goodbyeChannelId);
        if (this.config.welcome.logChannelId) ids.push(this.config.welcome.logChannelId);
        if (this.config.verification.verificationChannelId) ids.push(this.config.verification.verificationChannelId);
        if (this.config.verification.approvalChannelId) ids.push(this.config.verification.approvalChannelId);
        if (this.config.verification.logChannelId) ids.push(this.config.verification.logChannelId);
        if (this.config.ban.logChannelId) ids.push(this.config.ban.logChannelId);
        if (this.config.ban.blacklistLogChannelId) ids.push(this.config.ban.blacklistLogChannelId);
        if (this.config.influencer.tiktokChannelId) ids.push(this.config.influencer.tiktokChannelId);
        if (this.config.influencer.youtubeChannelId) ids.push(this.config.influencer.youtubeChannelId);
        if (this.config.ranking.rankingMvpChannelId) ids.push(this.config.ranking.rankingMvpChannelId);
        if (this.config.ranking.treinoResumoChannelId) ids.push(this.config.ranking.treinoResumoChannelId);

        return ids.filter(id => id !== '');
    }

    isConfiguredChannel(channelId: string): boolean {
        return this.getAllConfiguredChannelIds().includes(channelId);
    }

    getChannelPurpose(channelId: string): string | null {
        if (channelId === this.config.welcome.welcomeChannelId) return 'Boas-vindas';
        if (channelId === this.config.welcome.goodbyeChannelId) return 'Despedida';
        if (channelId === this.config.welcome.logChannelId) return 'Log de Saída';
        if (channelId === this.config.verification.verificationChannelId) return 'Verificação';
        if (channelId === this.config.verification.approvalChannelId) return 'Aprovação de Verificação';
        if (channelId === this.config.verification.logChannelId) return 'Log de Verificação';
        if (channelId === this.config.ban.logChannelId) return 'Log de Ban';
        if (channelId === this.config.ban.blacklistLogChannelId) return 'Log de Blacklist';
        if (channelId === this.config.influencer.tiktokChannelId) return 'Posts TikTok';
        if (channelId === this.config.influencer.youtubeChannelId) return 'Posts YouTube';
        if (channelId === this.config.ranking.rankingMvpChannelId) return 'Ranking MVP';
        if (channelId === this.config.ranking.treinoResumoChannelId) return 'Resumo de Treino';
        return null;
    }

    updateChannelId(oldChannelId: string, newChannelId: string): boolean {
        let updated = false;

        if (this.config.welcome.welcomeChannelId === oldChannelId) {
            this.config.welcome.welcomeChannelId = newChannelId;
            updated = true;
        }
        if (this.config.welcome.goodbyeChannelId === oldChannelId) {
            this.config.welcome.goodbyeChannelId = newChannelId;
            updated = true;
        }
        if (this.config.welcome.logChannelId === oldChannelId) {
            this.config.welcome.logChannelId = newChannelId;
            updated = true;
        }
        if (this.config.verification.verificationChannelId === oldChannelId) {
            this.config.verification.verificationChannelId = newChannelId;
            updated = true;
        }
        if (this.config.verification.approvalChannelId === oldChannelId) {
            this.config.verification.approvalChannelId = newChannelId;
            updated = true;
        }
        if (this.config.verification.logChannelId === oldChannelId) {
            this.config.verification.logChannelId = newChannelId;
            updated = true;
        }
        if (this.config.ban.logChannelId === oldChannelId) {
            this.config.ban.logChannelId = newChannelId;
            updated = true;
        }
        if (this.config.ban.blacklistLogChannelId === oldChannelId) {
            this.config.ban.blacklistLogChannelId = newChannelId;
            updated = true;
        }
        if (this.config.influencer.tiktokChannelId === oldChannelId) {
            this.config.influencer.tiktokChannelId = newChannelId;
            updated = true;
        }
        if (this.config.influencer.youtubeChannelId === oldChannelId) {
            this.config.influencer.youtubeChannelId = newChannelId;
            updated = true;
        }
        if (this.config.ranking.rankingMvpChannelId === oldChannelId) {
            this.config.ranking.rankingMvpChannelId = newChannelId;
            updated = true;
        }
        if (this.config.ranking.treinoResumoChannelId === oldChannelId) {
            this.config.ranking.treinoResumoChannelId = newChannelId;
            updated = true;
        }

        if (updated) {
            this.save();
        }

        return updated;
    }
}

export const channelConfig = new ChannelConfigService();
