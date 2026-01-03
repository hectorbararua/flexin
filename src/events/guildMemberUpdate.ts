import { AuditLogEvent, GuildMember } from 'discord.js';
import { Event } from '../core/types';
import { influencerRepository } from '../modules/influencer/InfluencerRepository';
import { profileRepository } from '../modules/influencer/ProfileRepository';
import { INFLUENCER_ROLE_IDS, PLATFORM_ROLE_IDS } from '../modules/influencer/constants';
import { Platform } from '../modules/influencer/types';
import { ROLE_IDS } from '../modules/verification';
import { PERMISSION_GROUPS, hasAnyRole } from '../config/roles';

export default new Event({
    name: 'guildMemberUpdate',
    async run(oldMember, newMember) {
        try {
            if (oldMember.partial) await oldMember.fetch();
            if (newMember.partial) await newMember.fetch();

            await protectVerificationRoles(oldMember as GuildMember, newMember as GuildMember);
            await syncInfluencerRole(newMember as GuildMember);
            await syncPlatformRole(newMember as GuildMember, 'tiktok');
            await syncPlatformRole(newMember as GuildMember, 'youtube');
        } catch {}
    },
});

async function protectVerificationRoles(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const protectedRoles = [ROLE_IDS.UNVERIFIED, ROLE_IDS.VERIFIED];
    
    const joinedAt = newMember.joinedAt;
    if (joinedAt && Date.now() - joinedAt.getTime() < 10000) {
        return;
    }
    
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    
    let roleChanged = false;
    for (const roleId of protectedRoles) {
        const hadRole = oldRoles.has(roleId);
        const hasRole = newRoles.has(roleId);
        if (hadRole !== hasRole) {
            roleChanged = true;
            break;
        }
    }
    
    if (!roleChanged) return;
    
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const auditLogs = await newMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberRoleUpdate,
            limit: 5,
        });
        
        const entry = auditLogs.entries.find(e => 
            e.target?.id === newMember.id && 
            Date.now() - e.createdTimestamp < 5000
        );
        
        if (!entry) return;
        
        const executor = entry.executor;
        if (!executor) return;
        
        if (executor.id === newMember.client.user?.id) return;
        
        const executorMember = await newMember.guild.members.fetch(executor.id);
        const canManage = hasAnyRole(executorMember.roles.cache, PERMISSION_GROUPS.CAN_MANAGE_VERIFICATION);
        
        if (canManage) return;
        
        for (const roleId of protectedRoles) {
            const hadRole = oldRoles.has(roleId);
            const hasRole = newRoles.has(roleId);
            
            if (hadRole && !hasRole) {
                await newMember.roles.add(roleId);
            } else if (!hadRole && hasRole) {
                await newMember.roles.remove(roleId);
            }
        }
        
        try {
            const dmChannel = await executor.createDM();
            await dmChannel.send({
                content: '❌ **Ação revertida automaticamente**\n\n' +
                    'Você não tem permissão para gerenciar os cargos de verificação manualmente.\n' +
                    'Esses cargos são gerenciados pelo sistema de verificação.\n\n' +
                    '_Esta mensagem é automática._',
            });
        } catch {}
    } catch {}
}

async function syncInfluencerRole(member: GuildMember): Promise<void> {
    const hasRole = member.roles.cache.has(INFLUENCER_ROLE_IDS.INFLUENCER);
    const isRegistered = influencerRepository.exists(member.id);

    if (hasRole && !isRegistered) {
        try {
            await member.roles.remove(INFLUENCER_ROLE_IDS.INFLUENCER);
            
            const dmChannel = await member.createDM();
            await dmChannel.send({
                content: '❌ **Cargo removido automaticamente**\n\n' +
                    'O cargo de **Influencer** só pode ser concedido por um administrador através do bot.\n\n' +
                    '_Esta mensagem é automática._',
            });
        } catch {}
    }
    
    if (!hasRole && isRegistered) {
        try {
            await member.roles.add(INFLUENCER_ROLE_IDS.INFLUENCER);
        } catch {}
    }
}

async function syncPlatformRole(member: GuildMember, platform: Platform): Promise<void> {
    const roleId = PLATFORM_ROLE_IDS[platform];
    if (!roleId) return;

    const hasRole = member.roles.cache.has(roleId);
    const hasProfile = profileRepository.exists(member.id, platform);

    if (hasRole && !hasProfile) {
        try {
            await member.roles.remove(roleId);
            
            const platformName = platform === 'tiktok' ? 'TikTok' : 'YouTube';
            
            const dmChannel = await member.createDM();
            await dmChannel.send({
                content: `❌ **Cargo removido automaticamente**\n\n` +
                    `O cargo de **${platformName}** só pode ser concedido quando você cadastra seu perfil com \`/perfil adicionar\`.\n\n` +
                    `_Esta mensagem é automática._`,
            });
        } catch {}
    }
    
    if (!hasRole && hasProfile) {
        try {
            await member.roles.add(roleId);
        } catch {}
    }
}
