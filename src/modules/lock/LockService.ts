import { GuildMember, PermissionFlagsBits, TextChannel } from 'discord.js';
import { LOCK_MESSAGES } from './constants';
import { PERMISSION_GROUPS, hasAnyRole } from '../../config/roles';

interface ServiceResult {
    success: boolean;
    message: string;
}

export class LockService {
    hasPermission(member: GuildMember): boolean {
        return hasAnyRole(member.roles.cache, PERMISSION_GROUPS.BAN_PERMISSION);
    }

    async lockChannel(channel: TextChannel, executor: GuildMember): Promise<ServiceResult> {
        if (!this.hasPermission(executor)) {
            return { success: false, message: LOCK_MESSAGES.ERROR_NO_PERMISSION };
        }

        try {
            const everyoneRole = channel.guild.roles.everyone;
            const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);

            if (currentPerms?.deny.has(PermissionFlagsBits.SendMessages)) {
                return { success: false, message: LOCK_MESSAGES.ERROR_ALREADY_LOCKED };
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
            });

            return { success: true, message: LOCK_MESSAGES.LOCK_SUCCESS(executor.id) };
        } catch {
            return { success: false, message: LOCK_MESSAGES.ERROR_LOCK_FAILED };
        }
    }

    async unlockChannel(channel: TextChannel, executor: GuildMember): Promise<ServiceResult> {
        if (!this.hasPermission(executor)) {
            return { success: false, message: LOCK_MESSAGES.ERROR_NO_PERMISSION };
        }

        try {
            const everyoneRole = channel.guild.roles.everyone;
            const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);

            if (!currentPerms?.deny.has(PermissionFlagsBits.SendMessages)) {
                return { success: false, message: LOCK_MESSAGES.ERROR_NOT_LOCKED };
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null,
            });

            return { success: true, message: LOCK_MESSAGES.UNLOCK_SUCCESS(executor.id) };
        } catch {
            return { success: false, message: LOCK_MESSAGES.ERROR_UNLOCK_FAILED };
        }
    }
}

export const lockService = new LockService();
