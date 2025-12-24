import { GuildMember } from 'discord.js';
import { ROLE_IDS } from '../../config';

interface InteractionLike {
    user: { id: string };
    member: unknown;
}

export class PermissionGuard {
    static hasStaffRole(member: GuildMember | null): boolean {
        if (!member) return false;
        return member.roles.cache.has(ROLE_IDS.STAFF);
    }

    static canUseCommand(interaction: InteractionLike): boolean {
        const member = interaction.member as GuildMember | null;
        return this.hasStaffRole(member);
    }

    static canRemovePlayer(interaction: InteractionLike): boolean {
        const member = interaction.member as GuildMember | null;
        return this.hasStaffRole(member);
    }
}
