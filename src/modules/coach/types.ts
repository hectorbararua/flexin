import { User, GuildMember } from 'discord.js';

export type GameStyle = 'agressivo' | 'passivo' | 'equilibrado' | 'clutch';
export type TeachingStyle = 'rigido' | 'calmo' | 'direto' | 'motivador';
export type Platform = 'pc' | 'console' | 'mobile';
export type Availability = 'manha' | 'tarde' | 'noite' | 'madrugada';
export type Experience = 'iniciante' | 'intermediario' | 'avancado';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface CoachProfile {
    gameStyle: GameStyle[];
    teachingStyle: TeachingStyle;
    main: string;
    platform: Platform;
    availability: Availability[];
    description?: string;
}

export interface Coach {
    id: string;
    odUserId: string;
    username: string;
    displayName: string;
    roleId: string;
    channelId: string;
    profile?: CoachProfile;
    studentIds: string[];
    createdAt: string;
    createdBy: string;
}

export interface StudentRequest {
    id: string;
    odUserId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    preferences: StudentPreferences;
    messageId?: string;
    ticketChannelId: string;
    status: RequestStatus;
    acceptedBy?: string;
    createdAt: string;
    resolvedAt?: string;
}

export interface StudentPreferences {
    gameStyle: GameStyle;
    teachingStyle: TeachingStyle;
    platform: Platform;
    fps: string;
    ping: string;
    availability: Availability[];
    experience: Experience;
    main: string;
    conexaoInfo: string;
}

export interface CoachData {
    coaches: Record<string, Coach>;
    requests: Record<string, StudentRequest>;
    [key: string]: unknown;
}

export const GAME_STYLE_DISPLAY: Record<GameStyle, string> = {
    agressivo: '🔥 Agressivo',
    passivo: '🛡️ Passivo',
    equilibrado: '⚖️ Equilibrado',
    clutch: '🎯 Clutch',
};

export const TEACHING_STYLE_DISPLAY: Record<TeachingStyle, string> = {
    rigido: '😤 Rígido',
    calmo: '😌 Calmo',
    direto: '🗣️ Direto',
    motivador: '🎉 Motivador',
};

export const PLATFORM_DISPLAY: Record<Platform, string> = {
    pc: '🖥️ PC',
    console: '🎮 Console',
    mobile: '📱 Mobile',
};

export const AVAILABILITY_DISPLAY: Record<Availability, string> = {
    manha: '☀️ Manhã (8h - 12h)',
    tarde: '🌤️ Tarde (12h - 18h)',
    noite: '🌙 Noite (18h - 00h)',
    madrugada: '🌚 Madrugada (00h - 8h)',
};

export const EXPERIENCE_DISPLAY: Record<Experience, string> = {
    iniciante: '🆕 Iniciante',
    intermediario: '📈 Intermediário',
    avancado: '⭐ Avançado',
};

export interface UserInfo {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
}

export function extractUserInfo(user: User): UserInfo {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.displayAvatarURL({ extension: 'png', size: 128 }),
    };
}

export function extractMemberInfo(member: GuildMember): UserInfo {
    return {
        id: member.id,
        username: member.user.username,
        displayName: member.displayName || member.user.username,
        avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 128 }),
    };
}

export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
