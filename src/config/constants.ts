export const GUILD_IDS = {
    MAIN: '1453013291734401249',
} as const;

export const ROLE_IDS = {
    STAFF: '1453076524797395116',
    MVP: '1453062885721772234',
} as const;

export const CHANNEL_IDS = {
    get RANKING_MVP() {
        const { channelConfig } = require('./ChannelConfigService');
        return channelConfig.ranking.rankingMvpChannelId;
    },
    get TREINO_RESUMO() {
        const { channelConfig } = require('./ChannelConfigService');
        return channelConfig.ranking.treinoResumoChannelId;
    },
} as const;

export const COLORS = {
    PRIMARY: '#00FFFF',
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFFF00',
} as const;
