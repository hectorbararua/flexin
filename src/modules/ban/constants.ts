import { OWNER_IDS, isOwner } from '../../config/owners';
import { STAFF_ROLES, PERMISSION_GROUPS } from '../../config/roles';
import { COLORS } from '../../config/emojis';

export { isOwner };

export const BAN_CONFIG = {
    ownerIds: OWNER_IDS,
    unbanAllRoleId: STAFF_ROLES.ADMIN,
    banRoleIds: PERMISSION_GROUPS.BAN_PERMISSION,
    embedColor: COLORS.PRIMARY,
} as const;

export const BAN_MESSAGES = {
    BAN_SUCCESS: (userId: string) => `✅ <@${userId}> foi banido com sucesso.`,
    UNBAN_SUCCESS: (userId: string) => `✅ <@${userId}> foi desbanido com sucesso.`,
    BLACKLIST_ADD_SUCCESS: (userId: string) => `✅ <@${userId}> foi adicionado à blacklist e banido.`,
    BLACKLIST_REMOVE_SUCCESS: (userId: string) => `✅ <@${userId}> foi removido da blacklist.`,
    UNBANALL_SUCCESS: (count: number) => `✅ ${count} usuário(s) foram desbanidos. (Blacklist mantida)`,

    ERROR_USER_NOT_FOUND: '❌ Usuário não encontrado.',
    ERROR_CANNOT_BAN_SELF: '❌ Você não pode banir a si mesmo.',
    ERROR_CANNOT_BAN_BOT: '❌ Você não pode banir o bot.',
    ERROR_USER_IN_BLACKLIST: '❌ Você não pode desbanir usuários que estão na blacklist!',
    ERROR_NOT_BANNED: '❌ Este usuário não está banido.',
    ERROR_NOT_IN_BLACKLIST: '❌ Este usuário não está na blacklist.',
    ERROR_ONLY_OWNERS: '❌ Apenas os donos podem gerenciar a blacklist.',
    ERROR_NOT_BLACKLIST_OWNER: '❌ Apenas quem adicionou este usuário à blacklist pode removê-lo.',
    ERROR_NO_PERMISSION: '❌ Você não tem permissão para usar este comando.',
    ERROR_MISSING_ARGS: '❌ Argumentos insuficientes. Use: ',
    ERROR_MISSING_REASON: '❌ Você precisa informar um motivo para o ban.',
    ERROR_BAN_FAILED: '❌ Erro ao banir usuário.',
    ERROR_UNBAN_FAILED: '❌ Erro ao desbanir usuário.',

    LOG_TITLE_BAN: '🔨 Usuário Banido',
    LOG_TITLE_UNBAN: '🔓 Usuário Desbanido',
    LOG_TITLE_BLACKLIST_ADD: '⛔ Adicionado à Blacklist',
    LOG_TITLE_BLACKLIST_REMOVE: '✅ Removido da Blacklist',
    LOG_TITLE_UNBANALL: '🔓 Desbanimento em Massa',
    LOG_TITLE_AUTO_BAN: '🤖 Ban Automático (Blacklist)',
} as const;

export const BAN_CUSTOM_IDS = {
    BLACKLIST_ADD: 'blacklist_add',
    BLACKLIST_REMOVE: 'blacklist_remove',
    BLACKLIST_LIST: 'blacklist_list',
    BLACKLIST_ADD_MODAL: 'blacklist_add_modal',
    BLACKLIST_REMOVE_MODAL: 'blacklist_remove_modal',
    BLACKLIST_USER_INPUT: 'blacklist_user_input',
    BLACKLIST_REASON_INPUT: 'blacklist_reason_input',
} as const;
