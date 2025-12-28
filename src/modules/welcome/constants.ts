import { EMOJIS, COLORS } from '../../config/emojis';
import { ColorResolvable } from 'discord.js';

export interface WelcomeConfig {
    gifUrl: string;
    color: ColorResolvable;
}

export interface GoodbyeConfig {
    gifUrl: string;
    color: ColorResolvable;
}

export const WELCOME_CONFIG: WelcomeConfig = {
    gifUrl: 'https://cdn.discordapp.com/attachments/1453203134821437513/1453510564704817223/b5abd23c0dcb57e7c533a3d6840c814d.gif',
    color: COLORS.PRIMARY,
} as const;

export const GOODBYE_CONFIG: GoodbyeConfig = {
    gifUrl: 'https://cdn.discordapp.com/attachments/877580492805914684/1453844788074909748/08cf4863cd27f36a349f9734e1e48b33.gif',
    color: COLORS.PRIMARY,
} as const;

export const WELCOME_MESSAGES = {
    TITLE: `${EMOJIS.SETINHA_ROXA} Bem-vindo(a) ao AUGE.`,
    DESCRIPTION: (mention: string) => `${EMOJIS.PONTO_ROXO} Olá, ${mention}. Sinta-se à vontade e aproveite o servidor.`,
} as const;

export const GOODBYE_MESSAGES = {
    LEAVE: {
        TITLE: `${EMOJIS.SETINHA_ROXA} Saída de membro`,
        DESCRIPTION: (username: string) => `${EMOJIS.PONTO_ROXO} ${username} saiu do servidor.`,
    },
    KICK: {
        TITLE: `${EMOJIS.SETINHA_ROXA} Membro expulso`,
        DESCRIPTION: (username: string) => `${EMOJIS.PONTO_ROXO} ${username} foi expulso do servidor.`,
    },
    BAN: {
        TITLE: `${EMOJIS.SETINHA_ROXA} Membro banido`,
        DESCRIPTION: (username: string) => `${EMOJIS.PONTO_ROXO} ${username} foi banido do servidor.`,
    },
    FOOTER: (userId: string) => `ID do usuário: ${userId}`,
} as const;

export const LOG_MESSAGES = {
    TITLE: '📋 Log de Saída',
} as const;

export type LeaveType = 'leave' | 'kick' | 'ban';
