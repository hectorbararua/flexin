import { Platform, PlatformConfig } from './types';
import { channelConfig } from '../../config/ChannelConfigService';

export const INFLUENCER_ROLE_IDS = {
    ADMIN: '1453512381530505247',
    INFLUENCER: '1453512378829242563',
} as const;

export const PLATFORM_ROLE_IDS: Record<Platform, string> = {
    tiktok: '1453516422721310740',
    youtube: '1453513122240270477',
    roblox: '',
} as const;

export const CUSTOM_EMOJIS = {
    TIKTOK: '<:tiktok:1453553970671915146>',
    YOUTUBE: '<:912969youtubelogo:1453555516008693821>',
    LIKE: '<:like:1453553969090658384>',
    ROBLOX: '<:roblox:1453553972102168577>',
} as const;

export function getInfluencerChannelId(platform: Platform): string {
    switch (platform) {
        case 'tiktok':
            return channelConfig.influencer.tiktokChannelId;
        case 'youtube':
            return channelConfig.influencer.youtubeChannelId;
        default:
            return '';
    }
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
    tiktok: {
        name: 'TikTok',
        emoji: CUSTOM_EMOJIS.TIKTOK,
        get channelId() { return channelConfig.influencer.tiktokChannelId; },
        urlPatterns: [
            /https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
            /https?:\/\/(vm|vt)\.tiktok\.com\/[\w]+/i,
            /https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i,
        ],
    },
    youtube: {
        name: 'YouTube',
        emoji: CUSTOM_EMOJIS.YOUTUBE,
        get channelId() { return channelConfig.influencer.youtubeChannelId; },
        urlPatterns: [
            /https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
            /https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/i,
            /https?:\/\/youtu\.be\/[\w-]+/i,
        ],
    },
    roblox: {
        name: 'Roblox',
        emoji: CUSTOM_EMOJIS.ROBLOX,
        channelId: '',
        urlPatterns: [],
    },
} as const;

export const PROFILE_URL_PATTERNS: Record<Platform, RegExp[]> = {
    tiktok: [
        /https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/?$/i,
    ],
    youtube: [
        /https?:\/\/(www\.)?youtube\.com\/@[\w.-]+\/?$/i,
        /https?:\/\/(www\.)?youtube\.com\/channel\/[\w-]+\/?$/i,
        /https?:\/\/(www\.)?youtube\.com\/c\/[\w.-]+\/?$/i,
    ],
    roblox: [
        /https?:\/\/(www\.|web\.)?roblox\.com/i,
    ],
} as const;

export const POST_COLORS = {
    TIKTOK: '#FF2F92',
    YOUTUBE: '#FF2F92',
    DEFAULT: '#FF2F92',
} as const;
