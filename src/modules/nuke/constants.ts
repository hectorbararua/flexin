import { ColorResolvable } from 'discord.js';

export const NUKE_CONFIG = {
    embedColor: '#FF2F92' as ColorResolvable,
} as const;

export const NUKE_MESSAGES = {
    SUCCESS: (userId: string) => `💥 Canal recriado por <@${userId}>.`,
    ERROR_NO_PERMISSION: '❌ Você não tem permissão para usar este comando.',
    ERROR_NUKE_FAILED: '❌ Erro ao recriar o canal.',
    ERROR_NOT_TEXT_CHANNEL: '❌ Este comando só pode ser usado em canais de texto.',
    CONFIRM_TITLE: '⚠️ Confirmar Nuke',
    CONFIRM_DESCRIPTION: (channelName: string, isConfigured: boolean, purpose?: string) => {
        let text = `Você está prestes a **recriar** o canal **#${channelName}**.\n\n`;
        text += `Isso irá:\n`;
        text += `• Deletar todo o histórico de mensagens\n`;
        text += `• Recriar o canal com as mesmas configurações\n`;
        
        if (isConfigured && purpose) {
            text += `\n⚠️ **ATENÇÃO**: Este canal está configurado no bot como **${purpose}**.\n`;
            text += `O ID será atualizado automaticamente.`;
        }
        
        return text;
    },
    CONFIRM_BUTTON: 'Confirmar Nuke',
    CANCEL_BUTTON: 'Cancelar',
    CANCELLED: '❌ Nuke cancelado.',
    CONFIG_UPDATED: (oldId: string, newId: string) => `✅ Configuração atualizada: ${oldId} → ${newId}`,
} as const;

export const NUKE_CUSTOM_IDS = {
    CONFIRM: 'nuke_confirm',
    CANCEL: 'nuke_cancel',
} as const;

