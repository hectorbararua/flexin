export const LOCK_MESSAGES = {
    LOCK_SUCCESS: (userId: string) => `🔒 Este canal foi trancado por <@${userId}>.`,
    UNLOCK_SUCCESS: (userId: string) => `🔓 Este canal foi destrancado por <@${userId}>.`,
    ERROR_NO_PERMISSION: '❌ Você não tem permissão para usar este comando.',
    ERROR_ALREADY_LOCKED: '❌ Este canal já está trancado.',
    ERROR_NOT_LOCKED: '❌ Este canal não está trancado.',
    ERROR_LOCK_FAILED: '❌ Erro ao trancar o canal.',
    ERROR_UNLOCK_FAILED: '❌ Erro ao destrancar o canal.',
} as const;

export const LOCK_COMMANDS = {
    LOCK: '!trancar',
    UNLOCK: '!destrancar',
} as const;
