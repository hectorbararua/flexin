import { GuildMember, PartialGuildMember, User } from 'discord.js';
import { UserUtils, UserInfo } from '../../shared/utils';

export interface MemberInfo extends UserInfo {
    createdAt: Date;
}

export interface WelcomeMessageData {
    member: MemberInfo;
    serverName: string;
}

export interface GoodbyeMessageData {
    member: MemberInfo;
    serverName: string;
}

export function extractMemberInfo(member: GuildMember | PartialGuildMember): MemberInfo {
    const baseInfo = UserUtils.extractFromMember(member);
    return {
        ...baseInfo,
        createdAt: member.user?.createdAt || new Date(),
    };
}

export function extractUserInfo(user: User): MemberInfo {
    const baseInfo = UserUtils.extractFromUser(user);
    return {
        ...baseInfo,
        createdAt: user.createdAt,
    };
}
