import { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder, 
    ApplicationCommandType, 
    Collection,
    StringSelectMenuInteraction,
    CacheType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction
} from "discord.js";
import { Command } from "../../structs/types/command";
import { 
    getSelfbotManager, 
    SelfbotClient, 
    getTokenService,
    getWhitelistService,
    getNotificationService,
    ActivityType
} from "../../lib/selfbot";

const tokenService = getTokenService();
const whitelistService = getWhitelistService();
const notificationService = getNotificationService();

async function ensureUserClient(userId: string, username: string): Promise<SelfbotClient | null> {
    const userData = tokenService.getUserToken(userId);
    
    if (!userData?.token) {
        return null;
    }
    
    const manager = getSelfbotManager();
    
    if (userData.selfbotClientId) {
        const existingClient = manager.getClient(userData.selfbotClientId);
        if (existingClient?.isReady()) {
            return existingClient;
        }
        
        if (existingClient) {
            manager.removeClient(userData.selfbotClientId);
        }
    }
    
    const clientId = manager.addClient({
        token: userData.token,
        label: `${username}-${userId.slice(-4)}`
    });
    
    tokenService.updateSelfbotClientId(userId, clientId);
    
    const client = manager.getClient(clientId);
    if (!client) {
        return null;
    }
    
    const loginSuccess = await client.login();
    
    if (!loginSuccess) {
        manager.removeClient(clientId);
        tokenService.updateSelfbotClientId(userId, '');
        return null;
    }
    
    return client;
}

function buildPainelEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("Painel Clear")
        .setDescription(
            `Cansado de DMs lotadas? O DM Cleaner foi criado para organizar e limpar suas mensagens privadas de forma rápida, simples e automatizada.\n\n` +
            `*✅ Antes de usar qualquer opção, vincule sua conta primeiro!*\n\n` +
            `• **CL**\nLimpa mensagens com uma pessoa específica.\n\n` +
            `• **Limpar Tudo**\nLimpa todas as mensagens com quem você tem DM aberta (não remove amigos).\n\n` +
            `• **Apagar DM Aberta**\nApaga todas as DMs abertas.\n\n` +
            `• **Fechar DMs**\nFecha todas as DMs abertas (não sai de grupos).\n\n` +
            `• **Outros**\nOpções para sair/excluir servidores e remover amigos.`
        )
        .setColor('#4B3B6A')
        .setImage('https://i.imgur.com/JQy8xQG.png')
        .setFooter({ text: 'Selecione uma opção abaixo para começar' });
}

function buildSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder()
                .setCustomId("painelcl:select")
                .setPlaceholder("Selecione uma opção")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("CL")
                        .setDescription("Limpar conversa com pessoa específica")
                        .setValue("cl")
                        .setEmoji("🧹"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Limpar Tudo")
                        .setDescription("Limpar mensagens com todos os amigos e DMs")
                        .setValue("limpar_tudo")
                        .setEmoji("🗑️"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Apagar DMs")
                        .setDescription("Apagar todas as DMs abertas")
                        .setValue("apagar_dms")
                        .setEmoji("❌"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Fechar DMs")
                        .setDescription("Fechar todas as DMs abertas")
                        .setValue("fechar_dms")
                        .setEmoji("📪"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Parar")
                        .setDescription("Parar ações em andamento")
                        .setValue("parar")
                        .setEmoji("🛑"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Rich Presence")
                        .setDescription("Configurar atividade personalizada")
                        .setValue("rich_presence")
                        .setEmoji("🎮"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Whitelist")
                        .setDescription("Gerenciar IDs protegidos do CL")
                        .setValue("whitelist")
                        .setEmoji("🛡️"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Token")
                        .setDescription("Vincular ou atualizar sua token")
                        .setValue("token")
                        .setEmoji("🔑")
                )
        ]
    });
}

async function resetSelectMenu(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    try {
        const embed = buildPainelEmbed();
        const selectMenu = buildSelectMenu();
        
        await interaction.webhook.editMessage(interaction.message.id, {
            embeds: [embed],
            components: [selectMenu]
        });
    } catch (error) {
        try {
            await interaction.message.edit({
                embeds: [buildPainelEmbed()],
                components: [buildSelectMenu()]
            });
        } catch {
        }
    }
}

async function handlePainelCLSelect(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const selected = interaction.values[0];
    const userId = interaction.user.id;
    
    const needsDefer = ["limpar_tudo", "apagar_dms", "fechar_dms", "parar"].includes(selected);
    
    if (needsDefer) {
        await interaction.deferReply({ ephemeral: true });
    }
    
    if (!["parar", "cl", "rich_presence"].includes(selected) && !tokenService.hasToken(userId)) {
        if (needsDefer) {
            await interaction.editReply({
                content: "❌ **Você precisa vincular sua token primeiro!**\nUse o comando `/painelcall` e selecione a opção `Token`."
            });
        } else {
            await interaction.reply({
                content: "❌ **Você precisa vincular sua token primeiro!**\nUse o comando `/painelcall` e selecione a opção `Token`.",
                ephemeral: true
            });
        }
        await resetSelectMenu(interaction);
        return;
    }
    
    try {
        switch (selected) {
            case "cl":
                await showCLModal(interaction);
                break;
            case "limpar_tudo":
                await handleLimparTudo(interaction);
                break;
            case "apagar_dms":
                await handleApagarDMs(interaction);
                break;
            case "fechar_dms":
                await handleFecharDMs(interaction);
                break;
            case "parar":
                await handleParar(interaction);
                break;
            case "rich_presence":
                await showRichPresenceModal(interaction);
                break;
            case "whitelist":
                await showWhitelistMenu(interaction);
                break;
            case "token":
                await showTokenModal(interaction);
                break;
            default:
                await interaction.reply({
                    content: "❌ Opção não reconhecida.",
                    ephemeral: true
                });
        }
        
        await resetSelectMenu(interaction);
    } catch (error: any) {
        console.error("Erro no handler:", error);
        await resetSelectMenu(interaction);
        if (error.code === 10062) {
            return;
        }
        throw error;
    }
}

async function showCLModal(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId("painelcl:modal_cl")
        .setTitle("Limpar Conversa")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("user_id_input")
                    .setLabel("ID do Usuário")
                    .setPlaceholder("Cole o ID do usuário aqui...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function showRichPresenceModal(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId("painelcl:modal_rp")
        .setTitle("Rich Presence")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("rp_name_input")
                    .setLabel("Nome da Atividade")
                    .setPlaceholder("Ex: Jogando Valorant")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("rp_image_input")
                    .setLabel("Imagem (apenas Discord CDN)")
                    .setPlaceholder("https://cdn.discordapp.com/attachments/...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );
    await interaction.showModal(modal);
}

async function showTokenModal(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const userId = interaction.user.id;
    const hasExistingToken = tokenService.hasToken(userId);
    
    const modal = new ModalBuilder()
        .setCustomId("painelcl:modal_token")
        .setTitle(hasExistingToken ? "Atualizar Token" : "Vincular Token")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("token_input")
                    .setLabel("Sua Token do Discord")
                    .setPlaceholder("Cole sua token aqui...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function handleTokenModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const token = interaction.fields.getTextInputValue("token_input").trim();
    const { id: userId, username } = interaction.user;
    
    await interaction.deferReply({ ephemeral: true });
    
    if (!token || token.length < 50) {
        await interaction.editReply({
            content: "❌ **Token inválida!**\n\nA token deve ter pelo menos 50 caracteres."
        });
        return;
    }
    
    try {
        tokenService.saveUserToken(userId, username, token);
        
        const client = await ensureUserClient(userId, username);
        
        if (client) {
            await interaction.editReply({
                content: `✅ **Token vinculada com sucesso!**\n\n` +
                    `👤 **Conta:** ${client.client.user?.tag || 'Conectando...'}\n` +
                    `🟢 **Status:** Online\n\n` +
                    `Agora você pode usar todas as funções do painel!`
            });
        } else {
            tokenService.deleteUserToken(userId);
            await interaction.editReply({
                content: "❌ **Token inválida ou expirada!**\n\n" +
                    "Verifique se a token está correta e tente novamente."
            });
        }
        
    } catch (error) {
        console.error("Erro ao vincular token:", error);
        await interaction.editReply({
            content: "❌ **Erro ao vincular token.**\nTente novamente mais tarde."
        });
    }
}

async function handleCLModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const targetUserId = interaction.fields.getTextInputValue("user_id_input");
    const { id: userId, username } = interaction.user;
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Sua conta não está online ou a token é inválida!**\nVincule sua token novamente."
            });
            return;
        }
        
        await interaction.editReply({
            content: `🧹 **Iniciando limpeza de DM...**\n\n` +
                `👤 **Usuário:** \`${targetUserId}\`\n` +
                `⏳ **Status:** Processando...\n\n` +
                `Use a opção \`Parar\` para cancelar.`
        });
        
        const deletedCount = await client.dmService.cleanDM(client.client, targetUserId);
        
        await notificationService.notifyCL(userId, targetUserId, deletedCount);
        
        await interaction.editReply({
            content: `✅ **Limpeza concluída!**\n\n` +
                `👤 **Usuário:** \`${targetUserId}\`\n` +
                `🗑️ **Mensagens deletadas:** ${deletedCount}`
        });
        
    } catch (error) {
        console.error("Erro ao limpar DM:", error);
        await interaction.editReply({
            content: "❌ **Erro ao limpar DM.**\nVerifique se o ID do usuário está correto."
        });
    }
}

async function handleLimparTudo(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const { id: userId, username } = interaction.user;
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Sua conta não está online ou a token é inválida!**"
            });
            return;
        }
        
        const friendCount = client.dmService.getFriendCount(client.client);
        const whitelist = whitelistService.getWhitelist(userId);
        const whitelistInfo = whitelist.length > 0 ? `\n🛡️ **Protegidos:** ${whitelist.length} IDs na whitelist` : '';
        
        await interaction.editReply({
            content: `🗑️ **Iniciando limpeza de mensagens com TODOS os amigos...**\n\n` +
                `👥 **Amigos encontrados:** ${friendCount}${whitelistInfo}\n` +
                `⏳ **Status:** Processando...\n\n` +
                `⚠️ Isso pode demorar bastante dependendo da quantidade de amigos!\n` +
                `Use a opção \`Parar\` para cancelar.`
        });
        
        const result = await client.dmService.cleanAllFriends(client.client, 300, whitelist);
        
        await notificationService.notifyLimparTudo(
            userId, 
            result.totalFriends || 0, 
            result.processed, 
            result.totalDeleted, 
            result.skipped || 0
        );
        
        let response = `✅ **Limpeza concluída!**\n\n` +
            `👥 **Amigos processados:** ${result.processed}/${result.totalFriends}\n` +
            `🗑️ **Mensagens deletadas:** ${result.totalDeleted}`;
        
        if (result.skipped && result.skipped > 0) {
            response += `\n🛡️ **Pulados (whitelist):** ${result.skipped}`;
        }
        
        await interaction.editReply({ content: response });
        
    } catch (error) {
        console.error("Erro ao limpar mensagens com amigos:", error);
        await interaction.editReply({
            content: "❌ **Erro ao limpar mensagens.**\nTente novamente mais tarde."
        });
    }
}

async function handleApagarDMs(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const { id: userId, username } = interaction.user;
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Sua conta não está online ou a token é inválida!**"
            });
            return;
        }
        
        const dmCount = client.dmService.getOpenDMCount(client.client);
        const whitelist = whitelistService.getWhitelist(userId);
        
        if (dmCount === 0) {
            await interaction.editReply({
                content: "⚠️ **Nenhuma DM aberta encontrada!**"
            });
            return;
        }
        
        const whitelistInfo = whitelist.length > 0 ? `\n🛡️ **Protegidos:** ${whitelist.length} IDs na whitelist` : '';
        
        await interaction.editReply({
            content: `🗑️ **Apagando suas mensagens nas DMs abertas...**\n\n` +
                `📊 **DMs encontradas:** ${dmCount}${whitelistInfo}\n` +
                `⏳ **Status:** Processando...\n\n` +
                `Use a opção \`Parar\` para cancelar.`
        });
        
        const result = await client.dmService.cleanAllDMs(client.client, 300, whitelist);
        
        await notificationService.notifyApagarDMs(
            userId,
            dmCount,
            result.processed,
            result.totalDeleted,
            result.skipped || 0
        );
        
        let response = `✅ **Mensagens apagadas!**\n\n` +
            `📊 **DMs processadas:** ${result.processed}\n` +
            `🗑️ **Mensagens deletadas:** ${result.totalDeleted}`;
        
        if (result.skipped && result.skipped > 0) {
            response += `\n🛡️ **Puladas (whitelist):** ${result.skipped}`;
        }
        
        await interaction.editReply({ content: response });
        
    } catch (error) {
        console.error("Erro ao apagar DMs:", error);
        await interaction.editReply({
            content: "❌ **Erro ao apagar mensagens das DMs.**\nTente novamente mais tarde."
        });
    }
}

async function handleFecharDMs(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const { id: userId, username } = interaction.user;
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Sua conta não está online ou a token é inválida!**"
            });
            return;
        }
        
        const dmCount = client.dmService.getOpenDMCount(client.client);
        
        await interaction.editReply({
            content: `📪 **Fechando todas as DMs abertas...**\n\n` +
                `📊 **DMs encontradas:** ${dmCount}\n` +
                `⏳ **Status:** Processando...`
        });
        
        const closed = await client.dmService.closeAllDMs(client.client);
        
        await notificationService.notifyFecharDMs(userId, dmCount, closed);
        
        await interaction.editReply({
            content: `✅ **DMs fechadas!**\n\n` +
                `📊 **Total:** ${closed} DMs fechadas`
        });
        
    } catch (error) {
        console.error("Erro ao fechar DMs:", error);
        await interaction.editReply({
            content: "❌ **Erro ao fechar DMs.**\nTente novamente mais tarde."
        });
    }
}

async function handleParar(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const { id: userId, username } = interaction.user;
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Você não tem uma conta vinculada!**"
            });
            return;
        }
        
        if (client.dmService.isRunning()) {
            client.dmService.stop();
            await interaction.editReply({
                content: `🛑 **Ações paradas!**\n\nTodas as operações em andamento foram canceladas.`
            });
        } else {
            await interaction.editReply({
                content: `⚠️ **Nenhuma ação em andamento!**`
            });
        }
        
    } catch (error) {
        console.error("Erro ao parar ações:", error);
        await interaction.editReply({
            content: "❌ **Erro ao parar ações.**"
        });
    }
}

function isDiscordCDN(url: string): boolean {
    return url.startsWith('https://cdn.discordapp.com/') || 
           url.startsWith('https://media.discordapp.net/');
}

function buildWhitelistEmbed(userId: string): EmbedBuilder {
    const whitelist = whitelistService.getWhitelist(userId);
    const count = whitelist.length;
    
    return new EmbedBuilder()
        .setTitle("🛡️ Sistema de Whitelist")
        .setDescription(
            `Gerencie os IDs de whitelist dos "Limpar Tudo" e "Apagar DMs".\n` +
            `Os IDs incluídos na whitelist **não serão afetados** pelo CL.\n\n` +
            `📊 **Status atual:**\n` +
            `${count} ID${count !== 1 ? 's' : ''} protegido${count !== 1 ? 's' : ''} na whitelist;\n\n` +
            `**Como funciona:**\n` +
            `• **Add Id:** Adiciona um ID à whitelist.\n` +
            `• **Remove Id:** Remove um ID da whitelist.\n` +
            `• **Listar Id:** Exibe todos os IDs protegidos na whitelist.`
        )
        .setColor('#4B3B6A')
        .setFooter({ text: 'Whitelist' });
}

function buildWhitelistButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("painelcl:whitelist_add")
                .setLabel("Add Id")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("painelcl:whitelist_remove")
                .setLabel("Remove Id")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("painelcl:whitelist_list")
                .setLabel("Listar Id")
                .setStyle(ButtonStyle.Secondary)
        );
}

async function showWhitelistMenu(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const embed = buildWhitelistEmbed(interaction.user.id);
    const buttons = buildWhitelistButtons();
    
    await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
    });
}

async function handleWhitelistAdd(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId("painelcl:modal_whitelist_add")
        .setTitle("Adicionar à Whitelist")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("whitelist_id_input")
                    .setLabel("ID do Usuário")
                    .setPlaceholder("Cole o ID do usuário que deseja proteger...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function handleWhitelistRemove(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId("painelcl:modal_whitelist_remove")
        .setTitle("Remover da Whitelist")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("whitelist_id_input")
                    .setLabel("ID do Usuário")
                    .setPlaceholder("Cole o ID do usuário que deseja remover...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function handleWhitelistList(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const userId = interaction.user.id;
    const whitelist = whitelistService.getWhitelist(userId);
    
    if (whitelist.length === 0) {
        await interaction.reply({
            content: "📋 **Whitelist vazia!**\n\nNenhum ID protegido no momento.",
            ephemeral: true
        });
        return;
    }
    
    const idList = whitelist.map((id: string, index: number) => `${index + 1}. <@${id}>`).join('\n');
    
    await interaction.reply({
        content: `📋 **IDs na Whitelist (${whitelist.length}):**\n\n${idList}`,
        ephemeral: true
    });
}

async function handleWhitelistAddModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const targetId = interaction.fields.getTextInputValue("whitelist_id_input").trim();
    const userId = interaction.user.id;
    
    if (!/^\d{17,19}$/.test(targetId)) {
        await interaction.reply({
            content: "❌ **ID inválido!**\n\nO ID deve conter apenas números (17-19 dígitos).",
            ephemeral: true
        });
        return;
    }
    
    const added = whitelistService.addId(userId, targetId);
    
    if (added) {
        await interaction.reply({
            content: `✅ **ID adicionado à whitelist!**\n\n` +
                `🛡️ <@${targetId}> agora está protegido do CL.\n\n` +
                `📊 **Total na whitelist:** ${whitelistService.getCount(userId)}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `⚠️ **ID já está na whitelist!**\n\n<@${targetId}> já está protegido.`,
            ephemeral: true
        });
    }
}

async function handleWhitelistRemoveModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const targetId = interaction.fields.getTextInputValue("whitelist_id_input").trim();
    const userId = interaction.user.id;
    
    const removed = whitelistService.removeId(userId, targetId);
    
    if (removed) {
        await interaction.reply({
            content: `✅ **ID removido da whitelist!**\n\n` +
                `<@${targetId}> não está mais protegido do CL.\n\n` +
                `📊 **Total na whitelist:** ${whitelistService.getCount(userId)}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `⚠️ **ID não encontrado na whitelist!**\n\n<@${targetId}> não estava protegido.`,
            ephemeral: true
        });
    }
}

async function handleRPModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const activityName = interaction.fields.getTextInputValue("rp_name_input");
    const imageURL = interaction.fields.getTextInputValue("rp_image_input") || undefined;
    const { id: userId, username } = interaction.user;
    
    try {
        await interaction.deferReply({ ephemeral: true });
    } catch (error) {
        console.error("Interação expirada:", error);
        return;
    }
    
    if (imageURL && !isDiscordCDN(imageURL)) {
        await interaction.editReply({
            content: "❌ **URL inválida!**\n\n" +
                "A imagem deve ser do Discord CDN:\n" +
                "• `https://cdn.discordapp.com/...`\n" +
                "• `https://media.discordapp.net/...`\n\n" +
                "**Como obter:** Envie a imagem no Discord → Clique direito → Copiar Link"
        });
        return;
    }
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Sua conta não está online ou a token é inválida!**"
            });
            return;
        }
        
        const success = client.activityService.setActivity(client.client, {
            name: activityName,
            type: ActivityType.PLAYING,
            startTimestamp: true,
            imageUrl: imageURL
        });
        
        if (success) {
            let response = `✅ **Rich Presence configurado!**\n\n` +
                `🎮 **Jogando:** ${activityName}\n` +
                `⏱️ **Tempo:** Ativado`;
            
            if (imageURL) response += `\n🖼️ **Imagem:** Configurada`;
            
            response += `\n\n💡 **Dica:** Use \`/desativar\` para remover o Rich Presence.`;
            
            await interaction.editReply({ content: response });
        } else {
            await interaction.editReply({
                content: "❌ **Erro ao configurar Rich Presence.**"
            });
        }
        
    } catch (error) {
        console.error("Erro ao configurar Rich Presence:", error);
        await interaction.editReply({
            content: "❌ **Erro ao configurar Rich Presence.**\nTente novamente mais tarde."
        });
    }
}


export default new Command({
    name: "painelcl",
    description: "Painel Clear - Limpar e gerenciar DMs",
    type: ApplicationCommandType.ChatInput,
    async run({ interaction }) {
        const embed = buildPainelEmbed();
        const selectMenu = buildSelectMenu();
        
        await interaction.reply({
            embeds: [embed],
            components: [selectMenu]
        });
    },
    
    selects: new Collection([
        ["painelcl:select", handlePainelCLSelect]
    ]),
    
    buttons: new Collection([
        ["painelcl:whitelist_add", handleWhitelistAdd],
        ["painelcl:whitelist_remove", handleWhitelistRemove],
        ["painelcl:whitelist_list", handleWhitelistList]
    ]),
    
    modals: new Collection([
        ["painelcl:modal_cl", handleCLModal],
        ["painelcl:modal_rp", handleRPModal],
        ["painelcl:modal_token", handleTokenModal],
        ["painelcl:modal_whitelist_add", handleWhitelistAddModal],
        ["painelcl:modal_whitelist_remove", handleWhitelistRemoveModal]
    ])
});
