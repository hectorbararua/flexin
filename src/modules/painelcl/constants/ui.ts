export const CUSTOM_IDS = {
    SELECT: 'painelcl:select',
    MODAL_CL: 'painelcl:modal_cl',
    MODAL_CL_SERVIDOR: 'painelcl:modal_cl_servidor',
    MODAL_RP: 'painelcl:modal_rp',
    MODAL_WHITELIST_ADD: 'painelcl:modal_whitelist_add',
    MODAL_WHITELIST_REMOVE: 'painelcl:modal_whitelist_remove',
    MODAL_CLONAR: 'painelcl:modal_clonar',
    WHITELIST_ADD: 'painelcl:whitelist_add',
    WHITELIST_REMOVE: 'painelcl:whitelist_remove',
    WHITELIST_LIST: 'painelcl:whitelist_list'
} as const;

export const INPUT_IDS = {
    USER_ID: 'user_id_input',
    SERVER_ID: 'server_id_input',
    RP_NAME: 'rp_name_input',
    RP_IMAGE: 'rp_image_input',
    WHITELIST_ID: 'whitelist_id_input',
    CLONE_SOURCE: 'clone_source_input',
    CLONE_TARGET: 'clone_target_input'
} as const;

export const EMOJIS = {
    CL: '🧹',
    CL_SERVIDOR: '🏠',
    LIMPAR_TUDO: '🗑️',
    APAGAR_DMS: '❌',
    FECHAR_DMS: '📪',
    PARAR: '🛑',
    RICH_PRESENCE: '🎮',
    WHITELIST: '🛡️',
    REMOVER_AMIGOS: '👥',
    SAIR_SERVIDORES: '🚪',
    CLONAR_SERVIDOR: '📋'
} as const;

export const COLORS = {
    PRIMARY: '#FFFFFF'
} as const;

export const PAINEL_CONFIG = {
    TITLE: 'Painel CL',
    IMAGE: 'https://cdn.discordapp.com/attachments/1452449457168715828/1452464598870655006/25183F00-0093-4B4F-B015-8492F4D199CB.gif?ex=6949e891&is=69489711&hm=8388dd1c5f5eceb5cee892daeb2290305591ad93a823c58633e793abd3872064&',
    FOOTER: 'Selecione uma opção abaixo',
    DESCRIPTION: `Organize e limpe suas mensagens de forma rápida e automatizada.

> ⚠️ **Conecte sua conta primeiro em** <#1452073178082840637>

**CL**
Limpa mensagens com uma pessoa ou grupo.

**CL Servidor**
Limpa suas mensagens em um servidor.

**CL Amigos**
Limpa mensagens com todos os amigos.

**CL DMs**
Limpa mensagens de conversas abertas.

**Fechar Conversas**
Fecha as conversas abertas.

**Outros**
Whitelist, Rich Presence, clonar servidor e mais.`
} as const;

export const MENU_OPTIONS = [
    { label: 'CL', description: 'Limpa mensagens com uma pessoa ou grupo', value: 'cl', emoji: EMOJIS.CL },
    { label: 'CL Servidor', description: 'Limpa suas mensagens em um servidor', value: 'cl_servidor', emoji: EMOJIS.CL_SERVIDOR },
    { label: 'CL Amigos', description: 'Limpa mensagens com todos os amigos', value: 'limpar_tudo', emoji: EMOJIS.LIMPAR_TUDO },
    { label: 'CL DMs', description: 'Limpa mensagens de conversas abertas', value: 'apagar_dms', emoji: EMOJIS.APAGAR_DMS },
    { label: 'Fechar Conversas', description: 'Fecha as conversas abertas', value: 'fechar_dms', emoji: EMOJIS.FECHAR_DMS },
    { label: 'Whitelist', description: 'Protege pessoas do CL', value: 'whitelist', emoji: EMOJIS.WHITELIST },
    { label: 'Rich Presence', description: 'Configura atividade personalizada', value: 'rich_presence', emoji: EMOJIS.RICH_PRESENCE },
    { label: 'Remover Amigos', description: 'Remove todos os amigos', value: 'remover_amigos', emoji: EMOJIS.REMOVER_AMIGOS },
    { label: 'Sair Servidores', description: 'Sai de todos os servidores', value: 'sair_servidores', emoji: EMOJIS.SAIR_SERVIDORES },
    { label: 'Clonar Servidor', description: 'Clona estrutura de um servidor', value: 'clonar_servidor', emoji: EMOJIS.CLONAR_SERVIDOR },
    { label: 'Parar', description: 'Para ações em andamento', value: 'parar', emoji: EMOJIS.PARAR }
] as const;
