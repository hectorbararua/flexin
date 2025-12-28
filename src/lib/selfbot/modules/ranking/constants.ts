import { RankingConfig } from './types';

export const RANKING_CONFIG: RankingConfig = {
    channelId: '1452489456555655228',
    guildId: '1453013291734401249',
    top10RoleId: '1452458963927826597',
    top3RoleId: '1452457972444692661',
    updateIntervalMs: 1 * 60 * 1000,
    updateHour: 18,
    updateMinute: 0
} as const;

export const MEDALS = ['🥇', '🥈', '🥉'] as const;

export const RANKING_MESSAGES = {
    TITLE: '🏆 Ranking de Tempo em Call',
    EMPTY: '*Nenhum usuário registrado ainda.*\n\nUse o painel de call para começar a acumular tempo!',
    FOOTER: 'Atualizado diariamente às 18:00'
} as const;

export const RANKING_COLORS = {
    GOLD: '#FFD700'
} as const;
