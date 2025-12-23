export const MESSAGES = {
    SUCCESS: {
        TOKEN_SAVED: (tag: string) => `✅ **Token vinculada com sucesso!**\n\n👤 **Conta:** ${tag}\n\nAgora você pode usar os comandos **CL** e **Call**!`,
        TOKEN_UPDATED: (tag: string) => `✅ **Token atualizada com sucesso!**\n\n👤 **Conta:** ${tag}`
    },
    ERRORS: {
        INVALID_TOKEN: '❌ Token inválida! Verifique se copiou corretamente.',
        TOKEN_SAVE_FAILED: '❌ Erro ao salvar token. Tente novamente.',
        TOKEN_EXPIRED: '❌ **Token inválida ou expirada!**\n\nVerifique se copiou corretamente e tente novamente.'
    },
    MODALS: {
        TOKEN: {
            TITLE: '🔑 Conectar Token',
            LABEL: 'Sua Token',
            PLACEHOLDER: 'Cole sua token aqui...'
        }
    }
} as const;

