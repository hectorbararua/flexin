export const MESSAGES = {
    ERRORS: {
        TOKEN_REQUIRED: '❌ **Você precisa vincular sua token primeiro!**\nSelecione a opção `Token` para vincular.',
        CLIENT_OFFLINE: '❌ **Sua conta não está online ou a token é inválida!**',
        TOKEN_INVALID: '❌ **Token inválida!**\n\nA token deve ter pelo menos 50 caracteres.',
        TOKEN_EXPIRED: '❌ **Token inválida ou expirada!**\n\nVerifique se a token está correta e tente novamente.',
        NO_FRIENDS: '⚠️ **Nenhum amigo encontrado!**',
        NO_DMS: '⚠️ **Nenhuma DM aberta encontrada!**',
        NO_GUILDS: '⚠️ **Nenhum servidor encontrado!**',
        NO_ACTION: '⚠️ **Nenhuma ação em andamento!**',
        INVALID_ID: '❌ **ID inválido!**\n\nO ID deve conter apenas números (17-19 dígitos).',
        INVALID_URL: '❌ **URL inválida!**\n\nA imagem deve ser do Discord CDN:\n• `https://cdn.discordapp.com/...`\n• `https://media.discordapp.net/...`\n\n**Como obter:** Envie a imagem no Discord → Clique direito → Copiar Link',
        GENERIC: '❌ **Erro ao processar.**\nTente novamente mais tarde.',
        OPTION_NOT_FOUND: '❌ Opção não reconhecida.',
        SERVER_NOT_FOUND: '❌ **Servidor não encontrado!**\n\nVerifique se o ID está correto e se você está no servidor.',
        NO_CHANNELS: '⚠️ **Nenhum canal de texto encontrado!**\n\nO servidor não possui canais que você possa acessar.'
    },
    
    SUCCESS: {
        TOKEN_LINKED: '✅ **Token vinculada com sucesso!**',
        ACTIONS_STOPPED: '🛑 **Ações paradas!**\n\nTodas as operações em andamento foram canceladas.',
        STOPPING: '🛑 **Parando operação...**'
    },
    
    PROCESSING: {
        CL: (targetId: string) => 
            `🧹 **Iniciando limpeza de DM...**\n\n👤 **Usuário:** \`${targetId}\`\n⏳ **Status:** Processando...\n\nUse a opção \`Parar\` para cancelar.`,
        
        CL_SERVIDOR: (guildName: string) =>
            `🏠 **Iniciando limpeza no servidor...**\n\n🏷️ **Servidor:** ${guildName}\n⏳ **Status:** Analisando canais...\n\nUse a opção \`Parar\` para cancelar.`,
        
        LIMPAR_TUDO: (count: number, whitelistInfo: string) =>
            `🗑️ **Iniciando limpeza de mensagens com TODOS os amigos...**\n\n👥 **Amigos encontrados:** ${count}${whitelistInfo}\n⏳ **Status:** Processando...\n\n⚠️ Isso pode demorar bastante dependendo da quantidade de amigos!\nUse a opção \`Parar\` para cancelar.`,
        
        APAGAR_DMS: (count: number, whitelistInfo: string) =>
            `🗑️ **Apagando suas mensagens nas DMs abertas...**\n\n📊 **DMs encontradas:** ${count}${whitelistInfo}\n⏳ **Status:** Processando...\n\nUse a opção \`Parar\` para cancelar.`,
        
        FECHAR_DMS: (count: number) =>
            `📪 **Fechando todas as DMs abertas...**\n\n📊 **DMs encontradas:** ${count}\n⏳ **Status:** Processando...`,
        
        REMOVER_AMIGOS: (count: number, whitelistInfo: string) =>
            `👥 **Removendo todos os amigos...**\n\n📊 **Amigos encontrados:** ${count}${whitelistInfo}\n⏳ **Status:** Processando...\n\n⚠️ **ATENÇÃO:** Esta ação é irreversível!\nUse a opção \`Parar\` para cancelar.`,
        
        SAIR_SERVIDORES: (count: number, whitelistInfo: string) =>
            `🚪 **Saindo de todos os servidores...**\n\n📊 **Servidores encontrados:** ${count}${whitelistInfo}\n🛡️ **Servidor atual:** Protegido automaticamente\n⏳ **Status:** Processando...\n\n⚠️ **ATENÇÃO:** Esta ação é irreversível!\nUse a opção \`Parar\` para cancelar.`
    },
    
    RESULTS: {
        CL: (targetId: string, deleted: number) =>
            `✅ **Limpeza concluída!**\n\n👤 **Usuário:** \`${targetId}\`\n🗑️ **Mensagens deletadas:** ${deleted}`,
        
        CL_SERVIDOR: (guildName: string, channels: number, deleted: number, stopped: boolean) => {
            let result = `✅ **Limpeza no servidor concluída!**\n\n`;
            result += `🏷️ **Servidor:** ${guildName}\n`;
            result += `📁 **Canais processados:** ${channels}\n`;
            result += `🗑️ **Mensagens deletadas:** ${deleted}`;
            if (stopped) result += `\n\n🛑 **Operação interrompida pelo usuário**`;
            return result;
        },
        
        LIMPAR_TUDO: (processed: number, total: number, deleted: number) =>
            `✅ **Limpeza concluída!**\n\n👥 **Amigos processados:** ${processed}/${total}\n🗑️ **Mensagens deletadas:** ${deleted}`,
        
        APAGAR_DMS: (processed: number, deleted: number) =>
            `✅ **Mensagens apagadas!**\n\n📊 **DMs processadas:** ${processed}\n🗑️ **Mensagens deletadas:** ${deleted}`,
        
        FECHAR_DMS: (closed: number) =>
            `✅ **DMs fechadas!**\n\n📊 **Total:** ${closed} DMs fechadas`,
        
        REMOVER_AMIGOS: (removed: number, total: number) =>
            `✅ **Remoção de amigos concluída!**\n\n👥 **Amigos removidos:** ${removed}/${total}`,
        
        SAIR_SERVIDORES: (left: number, total: number) =>
            `✅ **Saída de servidores concluída!**\n\n🚪 **Servidores deixados:** ${left}/${total}`
    },
    
    WHITELIST: {
        ADDED: (targetId: string, total: number) =>
            `✅ **ID adicionado à whitelist!**\n\n🛡️ <@${targetId}> agora está protegido do CL.\n\n📊 **Total na whitelist:** ${total}`,
        
        ALREADY_EXISTS: (targetId: string) =>
            `⚠️ **ID já está na whitelist!**\n\n<@${targetId}> já está protegido.`,
        
        REMOVED: (targetId: string, total: number) =>
            `✅ **ID removido da whitelist!**\n\n<@${targetId}> não está mais protegido do CL.\n\n📊 **Total na whitelist:** ${total}`,
        
        NOT_FOUND: (targetId: string) =>
            `⚠️ **ID não encontrado na whitelist!**\n\n<@${targetId}> não estava protegido.`,
        
        EMPTY: '📋 **Whitelist vazia!**\n\nNenhum ID protegido no momento.',
        
        LIST: (count: number, list: string) =>
            `📋 **IDs na Whitelist (${count}):**\n\n${list}`
    },
    
    RICH_PRESENCE: {
        SUCCESS: (name: string) =>
            `✅ **Rich Presence configurado!**\n\n🎮 **Jogando:** ${name}\n⏱️ **Tempo:** Ativado`,
        
        WITH_IMAGE: '\n🖼️ **Imagem:** Configurada',
        
        TIP: '\n\n💡 **Dica:** Use `/desativar` para remover o Rich Presence.',
        
        NOT_SHOWING: '\n\n⚠️ **Não está aparecendo?**\nVá em **Configurações do Discord** → **Privacidade de Atividades** → Ative **"Compartilhar minhas atividades"**',
        
        ERROR: '❌ **Erro ao configurar Rich Presence.**'
    },
    
    EXTRAS: {
        SKIPPED: (count: number) => `\n🛡️ **Pulados (whitelist):** ${count}`,
        ERRORS: (count: number) => `\n❌ **Erros:** ${count}`,
        STOPPED: '\n\n🛑 **Operação interrompida pelo usuário**',
        WHITELIST_INFO: (count: number) => count > 0 ? `\n🛡️ **Protegidos:** ${count} IDs na whitelist` : ''
    },
    
    CLONE: {
        PROCESSING: '📋 **Iniciando clonagem...**\n\n⏳ Analisando servidores...',
        
        PROGRESS: (message: string) => 
            `📋 **Clonando servidor...**\n\n${message}`,
        
        SUCCESS: (isAdmin: boolean, categories: number, channels: number, roles: number, emojis: number, errors: number) => {
            const adminInfo = isAdmin ? '✅ **Modo:** Admin (clonagem completa)' : '⚠️ **Modo:** Limitado (apenas visível)';
            let result = `📋 **Clonagem concluída!**\n\n${adminInfo}\n\n`;
            result += `📁 **Categorias:** ${categories}\n`;
            result += `💬 **Canais:** ${channels}\n`;
            if (isAdmin) {
                result += `👥 **Cargos:** ${roles}\n`;
            }
            result += `😀 **Emojis:** ${emojis}`;
            if (errors > 0) {
                result += `\n❌ **Erros:** ${errors}`;
            }
            return result;
        },
        
        ERROR_SOURCE_NOT_FOUND: '❌ **Servidor de origem não encontrado!**\n\nVerifique se o ID está correto e se você está no servidor.',
        ERROR_TARGET_NOT_FOUND: '❌ **Servidor de destino não encontrado!**\n\nVerifique se o ID está correto e se você é ADMIN nele.',
        ERROR_NO_PERMISSION: '❌ **Sem permissão no servidor de destino!**\n\nVocê precisa ser **ADMIN** no servidor onde quer criar a estrutura.',
        ERROR_GENERIC: '❌ **Erro ao clonar servidor.**\n\nTente novamente mais tarde.',
        STOPPED: '🛑 **Clonagem interrompida!**'
    }
} as const;
