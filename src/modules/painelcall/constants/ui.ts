export const CUSTOM_IDS = {
    SELECT: 'painelcall:select',
    MODAL_CALL: 'painelcall:modal_call',
    MODAL_CALL_MUTED: 'painelcall:modal_call_muted',
    MODAL_COLEIRA: 'painelcall:modal_coleira'
} as const;

export const EMOJIS = {
    CALL: '📞',
    CALL_MUTED: '🔇',
    LEAVE: '🚪',
    COLEIRA: '🔗',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    USER: '👤',
    LINK: '🔗',
    MIC: '🎙️',
    MUTED: '🔇',
    UNMUTED: '🔊'
} as const;

export const COLORS = {
    PRIMARY: '#FFFFFF',
    SUCCESS: '#00FF00',
    ERROR: '#FF0000'
} as const;

export const INPUT_IDS = {
    CALL_ID: 'call_id_input',
    COLEIRA_USER_ID: 'coleira_user_id_input'
} as const;

export const RICH_PRESENCE_CONFIG = {
    APPLICATION_ID: '1422775039975096340',
    NAME: 'Ego',
    DETAILS: 'Ego - /painel',
    STATE: 'By S1nt - Call Farm 24/7',
    IMAGE: 'https://cdn.discordapp.com/attachments/1452056000705200239/1452478642201559263/mirai_nikki_anime_gif_GIF.gif?ex=6949f5a6&is=6948a426&hm=65d39fe9723175bc79e7575c8deecefb4b3d3118bc282fa125840015bd78458a',
    BUTTON_LABEL: 'Ego',
    BUTTON_URL: 'https://discord.gg/ZPxPUZFpUM'
} as const;

export const CALL_ROLE_CONFIG = {
    guildId: '1453013291734401249',
    roleId: '1453033214489661545'
} as const;

export type CustomIdType = typeof CUSTOM_IDS[keyof typeof CUSTOM_IDS];
export type EmojiType = typeof EMOJIS[keyof typeof EMOJIS];
