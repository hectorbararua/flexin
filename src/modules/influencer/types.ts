export type Platform = 'tiktok' | 'youtube' | 'roblox';

export interface Influencer {
    discordId: string;
    addedBy: string;
    addedAt: string;
}

export interface Profile {
    discordId: string;
    platform: Platform;
    profileUrl: string;
    username: string;
    addedAt: string;
}

export interface Post {
    id: string;
    messageId: string;
    channelId: string;
    authorId: string;
    platform: Platform;
    videoUrl: string;
    description: string;
    likes: string[];
    threadId?: string;
    createdAt: string;
}

export interface InfluencerData {
    [discordId: string]: Influencer;
}

export interface ProfileData {
    [discordId: string]: Profile[];
}

export interface PostData {
    [messageId: string]: Post;
}

export interface PlatformConfig {
    name: string;
    emoji: string;
    channelId: string;
    urlPatterns: RegExp[];
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
    platform?: Platform;
    videoUrl?: string;
    description?: string;
}

