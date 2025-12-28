export const MESSAGES = {
    PANEL: {
        TITLE: 'Painel Call',
        DESCRIPTION: 
            `Gerencie suas calls de forma automatizada.

> ⚠️ **Conecte sua conta primeiro em** <#1452073178082840637>

**Call**
Entra na call desmutado.

**Call Mutado**
Entra na call mutado.

**Sair**
Sai da call atual.

**Coleira**
Puxa uma pessoa para sua call.

**Como usar:**
• **Call de servidor** → Cole o ID do canal de voz
• **Call privada** → Cole o ID do usuário`,
        PLACEHOLDER: 'Selecione uma opção',
        IMAGE: 'https://cdn.discordapp.com/attachments/1452449457168715828/1452464600460165190/3B450BD1-4F50-4498-A9CE-938ACDDB5742.gif?ex=6949e892&is=69489712&hm=a9b75b08c649cdab466290d7ab158634e333bf989efbe6d90c2c8ed6ebf0ae17&'
    },
    
    OPTIONS: {
        CALL: {
            LABEL: 'Call',
            DESCRIPTION: 'Entra na call desmutado'
        },
        CALL_MUTED: {
            LABEL: 'Call Mutado',
            DESCRIPTION: 'Entra na call mutado'
        },
        LEAVE: {
            LABEL: 'Sair',
            DESCRIPTION: 'Sai da call atual'
        },
        COLEIRA: {
            LABEL: 'Coleira',
            DESCRIPTION: 'Puxa uma pessoa para sua call'
        }
    },
    
    MODALS: {
        CALL: {
            TITLE: 'Entrar na Call',
            TITLE_MUTED: 'Entrar na Call (Mutado)',
            LABEL: 'ID da Call ou do Usuário',
            PLACEHOLDER: 'Insira o ID aqui...'
        },
        COLEIRA: {
            TITLE: 'Configurar Coleira',
            LABEL: 'ID do Usuário Alvo',
            PLACEHOLDER: 'Cole o ID do usuário que deseja puxar...'
        }
    },
    
    RESPONSES: {
        CALL: {
            SUCCESS: (callId: string, tag: string, muteStatus: string) =>
                `✅ **Entrando na call!**\n\n` +
                `📞 **ID:** \`${callId}\`\n` +
                `👤 **Conta:** ${tag}\n` +
                `🎙️ **Status:** ${muteStatus}`,
            ERROR_JOIN:
                `❌ **Falha ao entrar na call!**\n\n` +
                `Verifique se:\n` +
                `• O ID está correto\n` +
                `• Sua conta tem acesso ao canal\n` +
                `• O canal é de voz`,
            ERROR_GENERIC: '❌ **Erro ao entrar na call.**\nTente novamente mais tarde.'
        },
        LEAVE: {
            SUCCESS: '✅ **Você saiu da call com sucesso!**',
            NOT_IN_CALL: '⚠️ **Você não está em nenhuma call!**',
            ERROR: '❌ **Erro ao sair da call.**'
        },
        NO_TOKEN: '❌ **Você precisa vincular sua token primeiro!**\nUse `/paineltutorial` para conectar sua conta.',
        NO_CLIENT: '❌ **Sua conta não está online ou a token é inválida!**\nUse `/paineltutorial` para vincular novamente.',
        UNKNOWN_OPTION: '❌ Opção não reconhecida.',
        COLEIRA: {
            STARTED: (targetId: string) =>
                `🔗 **Coleira ativada!**\n\n` +
                `👤 **Alvo:** <@${targetId}>\n` +
                `⏱️ **Intervalo:** 5 segundos\n\n` +
                `O usuário será puxado para onde **você** estiver.\n` +
                `Se você mudar de call, ele será puxado junto!\n\n` +
                `Para desativar, selecione \`Coleira\` novamente.`,
            STOPPED: '🔗 **Coleira desativada!**',
            NOT_IN_CALL: '⚠️ **Você não está em nenhuma call!**\nEntre em uma call primeiro para ativar a coleira.',
            TARGET_NOT_IN_SERVER: '⚠️ **Usuário não encontrado no servidor!**\nVerifique se o ID está correto e se vocês estão no mesmo servidor.',
            PULLING: (targetId: string) => `🔗 Puxando <@${targetId}>...`,
            ERROR: '❌ **Erro ao configurar coleira.**'
        }
    }
} as const;

