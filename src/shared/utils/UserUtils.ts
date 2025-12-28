import { GuildMember, PartialGuildMember, User } from 'discord.js';

export interface UserInfo {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
}

export class UserUtils {
    static extractUserId(input: string): string | null {
        const mentionMatch = input.match(/<@!?(\d+)>/);
        if (mentionMatch) return mentionMatch[1];

        if (/^\d{17,20}$/.test(input)) return input;

        return null;
    }

    static extractFromUser(user: User): UserInfo {
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatarUrl: user.displayAvatarURL({ extension: 'png', size: 128 }),
        };
    }

    static extractFromMember(member: GuildMember | PartialGuildMember): UserInfo {
        return {
            id: member.id,
            username: member.user?.username || 'Desconhecido',
            displayName: member.displayName || member.user?.username || 'Desconhecido',
            avatarUrl: member.user?.displayAvatarURL({ extension: 'png', size: 128 }) || '',
        };
    }

    static formatDate(date: Date): string {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    static formatTimeDiff(from: Date, to: Date = new Date()): string {
        const diff = to.getTime() - from.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days} dia(s), ${hours}h ${minutes}min`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes} minuto(s)`;
        }
    }
}
