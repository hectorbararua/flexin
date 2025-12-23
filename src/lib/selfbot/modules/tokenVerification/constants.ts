export interface VerificationConfig {
    readonly logChannelId: string;
    readonly guildId: string;
    readonly verifiedRoleId: string;
    readonly unverifiedRoleId: string;
    readonly verificationHour: number;
    readonly verificationMinute: number;
}

export const VERIFICATION_CONFIG: VerificationConfig = {
    logChannelId: '1453019680683065355',
    guildId: '1453013291734401249',
    verifiedRoleId: '1453031454257713192',
    unverifiedRoleId: '1453031495466876990',
    verificationHour: 18,
    verificationMinute: 0
} as const;

export const VERIFICATION_MESSAGES = {
    TITLE: '🔍 Verificação Diária de Tokens',
    STARTING: '⏳ Iniciando verificação de tokens...',
    VALID: (tag: string, userId: string) => `✅ <@${userId}> - Token válida (${tag})`,
    INVALID: (userId: string) => `❌ <@${userId}> - Token inválida/expirada`,
    SUMMARY: (total: number, valid: number, invalid: number) => 
        `\n📊 **Resumo:**\n` +
        `• Total verificado: **${total}**\n` +
        `• Válidas: **${valid}** ✅\n` +
        `• Inválidas: **${invalid}** ❌`,
    NO_TOKENS: '📭 Nenhuma token registrada para verificar.'
} as const;
