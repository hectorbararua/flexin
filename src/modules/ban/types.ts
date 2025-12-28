export interface BlacklistEntry {
    odId: string;
    odUsername: string;
    odAvatar?: string;
    reason: string;
    bannedBy: string;
    bannedByUsername: string;
    bannedAt: Date;
}

export interface BanLogData {
    odId: string;
    odUsername: string;
    odAvatar?: string;
    reason: string;
    moderatorId: string;
    moderatorUsername: string;
    action: BanAction;
}

export type BanAction = 'ban' | 'unban' | 'blacklist_add' | 'blacklist_remove' | 'unbanall';

export interface BanConfig {
    logChannelId: string;
    blacklistLogChannelId: string;
    ownerIds: string[];
    unbanAllRoleId: string;
    banRoleIds: string[];
}

export interface CommandContext {
    authorId: string;
    authorUsername: string;
    isOwner: boolean;
    hasUnbanAllRole: boolean;
    hasBanPermission: boolean;
}

