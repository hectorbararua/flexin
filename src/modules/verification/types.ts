import { User, GuildMember } from 'discord.js';

export interface VerificationConfig {
    verificationChannelId: string;
    approvalChannelId: string;
    logChannelId: string;
    verifierRoleIds: string[];
    embedColor: string;
}

export interface VerificationRequest {
    id: string;
    requesterId: string;
    requesterUsername: string;
    requesterAvatarUrl: string;
    verifierId: string;
    verifierUsername: string;
    question: string;
    answer: string;
    status: VerificationStatus;
    createdAt: Date;
    resolvedAt?: Date;
    resolvedById?: string;
    resolvedByUsername?: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequestData {
    requester: UserInfo;
    verifier: UserInfo;
    answer: string;
}

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

