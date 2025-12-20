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
    ModalSubmitInteraction
} from "discord.js";
import { Command } from "../../structs/types/command";
import { getSelfbotManager, SelfbotClient, getTokenService, getNotificationService } from "../../lib/selfbot";

const tokenService = getTokenService();
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
        .setTitle("📞 Painel Call")
        .setDescription(
            `**📋 Como funciona:**\n` +
            `O sistema funciona por chamadas de servidor ou privadas. Antes de usar, é necessário vincular sua token no botão abaixo "\`Token\`", que ficará fixa na call.\n\n` +
            `**✏️ Como usar:**\n` +
            `Ao clicar no botão "\`Call\`", será aberto um painel onde você deverá inserir o ID da call ou o ID do usuário para entrar na chamada.\n\n` +
            `• **Para servidor** → insira o ID da call\n` +
            `• **Para pessoa** → insira o ID do usuário\n\n` +
            `> **Observação:**\n` +
            `> Caso ocorra algum erro, abra um ticket ou verifique se sua token está no servidor correto.\n\n` +
            `**🔊 Sair da call:**\n` +
            `Para sair da call a qualquer momento, use o comando:\n` +
            `\`/leave\` ou \`/sair\``
        )
        .setColor('#4B3B6A');
}

function buildSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder()
                .setCustomId("painelcall:select")
                .setPlaceholder("Selecione uma opção")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Token")
                        .setDescription("Vincular sua token")
                        .setValue("token")
                        .setEmoji("🔑"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Call")
                        .setDescription("Entrar desmutado na call")
                        .setValue("call")
                        .setEmoji("📞"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Call Mutado")
                        .setDescription("Entrar mutado na call")
                        .setValue("call_muted")
                        .setEmoji("🔇"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Sair")
                        .setDescription("Sair da call atual")
                        .setValue("sair")
                        .setEmoji("🚪")
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

async function handlePainelSelect(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const selected = interaction.values[0];
    const userId = interaction.user.id;
    
    switch (selected) {
        case "token":
            await showTokenModal(interaction);
            await resetSelectMenu(interaction);
            break;
            
        case "call":
        case "call_muted":
            if (!tokenService.hasToken(userId)) {
                await interaction.reply({
                    content: "❌ **Você precisa vincular sua token primeiro!**\nSelecione a opção `Token` no menu.",
                    ephemeral: true
                });
                await resetSelectMenu(interaction);
                return;
            }
            
            const isMuted = selected === "call_muted";
            await showCallModal(interaction, isMuted);
            await resetSelectMenu(interaction);
            break;
            
        case "sair":
            await handleLeaveCall(interaction);
            await resetSelectMenu(interaction);
            break;
            
        default:
            await interaction.reply({
                content: "❌ Opção não reconhecida.",
                ephemeral: true
            });
            await resetSelectMenu(interaction);
    }
}

async function showTokenModal(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId("painelcall:modal_token")
        .setTitle("Vincular Token")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("token_input")
                    .setLabel("Insira sua Token")
                    .setPlaceholder("Cole sua token aqui...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function showCallModal(interaction: StringSelectMenuInteraction<CacheType>, isMuted: boolean): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId(isMuted ? "painelcall:modal_call_muted" : "painelcall:modal_call")
        .setTitle(isMuted ? "Entrar na Call (Mutado)" : "Entrar na Call")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId("call_id_input")
                    .setLabel("ID da Call ou do Usuário")
                    .setPlaceholder("Insira o ID aqui...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    await interaction.showModal(modal);
}

async function handleTokenModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const token = interaction.fields.getTextInputValue("token_input");
    const { id: userId, username } = interaction.user;
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const manager = getSelfbotManager();
        
        const existingData = tokenService.getUserToken(userId);
        if (existingData?.selfbotClientId) {
            const existingClient = manager.getClient(existingData.selfbotClientId);
            if (existingClient) {
                manager.removeClient(existingData.selfbotClientId);
            }
        }
        
        tokenService.saveUserToken(userId, username, token);
        
        const clientId = manager.addClient({
            token: token,
            label: `${username}-${userId.slice(-4)}`
        });
        
        tokenService.updateSelfbotClientId(userId, clientId);
        
        const client = manager.getClient(clientId);
        if (!client) {
            await interaction.editReply({
                content: "❌ **Erro ao criar cliente selfbot.**"
            });
            return;
        }
        
        const loginSuccess = await client.login();
        
        if (loginSuccess) {
            await interaction.editReply({
                content: `✅ **Token vinculada com sucesso!**\n\n` +
                    `👤 **Conta:** ${client.tag || 'Conectando...'}\n` +
                    `🔗 **Status:** Online\n\n` +
                    `Sua conta ficará fixa nas calls. Use a opção \`Call\` para entrar em uma chamada.`
            });
        } else {
            manager.removeClient(clientId);
            tokenService.updateSelfbotClientId(userId, '');
            
            await interaction.editReply({
                content: `❌ **Falha ao conectar!**\n\n` +
                    `Verifique se sua token está correta e tente novamente.\n` +
                    `> Dica: A token deve ser válida e a conta não pode estar desativada.`
            });
        }
        
    } catch (error) {
        console.error("Erro ao vincular token:", error);
        await interaction.editReply({
            content: "❌ **Erro ao vincular token.**\nTente novamente mais tarde."
        });
    }
}

async function handleCallModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    await processCallModal(interaction, false);
}

async function handleCallMutedModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    await processCallModal(interaction, true);
}

async function processCallModal(interaction: ModalSubmitInteraction<CacheType>, isMuted: boolean): Promise<void> {
    const callId = interaction.fields.getTextInputValue("call_id_input");
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
        
        const success = await client.voiceService.join(client.client, callId, {
            selfMute: isMuted,
            selfDeaf: isMuted
        });
        
        const muteStatus = isMuted ? '🔇 Mutado' : '🔊 Desmutado';
        
        if (success) {
            await notificationService.notifyCallJoin(userId, `Canal ${callId}`, callId);
            
            await interaction.editReply({
                content: `✅ **Entrando na call!**\n\n` +
                    `📞 **ID:** \`${callId}\`\n` +
                    `👤 **Conta:** ${client.tag}\n` +
                    `🎙️ **Status:** ${muteStatus}\n\n` +
                    `Para sair, use a opção \`Sair\` no menu.`
            });
        } else {
            await interaction.editReply({
                content: `❌ **Falha ao entrar na call!**\n\n` +
                    `Verifique se:\n` +
                    `• O ID está correto\n` +
                    `• Sua conta tem acesso ao canal\n` +
                    `• O canal é de voz`
            });
        }
        
    } catch (error) {
        console.error("Erro ao entrar na call:", error);
        await interaction.editReply({
            content: "❌ **Erro ao entrar na call.**\nTente novamente mais tarde."
        });
    }
}

async function handleLeaveCall(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const { id: userId, username } = interaction.user;
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const client = await ensureUserClient(userId, username);
        
        if (!client) {
            await interaction.editReply({
                content: "❌ **Você não tem uma token vinculada ou ela é inválida!**"
            });
            return;
        }
        
        const targetGuildId = client.voiceService.getTargetGuildId();
        
        if (!targetGuildId) {
            await interaction.editReply({
                content: "⚠️ **Você não está em nenhuma call!**"
            });
            return;
        }
        
        const success = await client.voiceService.leave(client.client, targetGuildId);
        
        if (success) {
            await notificationService.notifyCallLeave(userId, 'Saiu voluntariamente');
            
            await interaction.editReply({
                content: `✅ **Você saiu da call com sucesso!**`
            });
        } else {
            await interaction.editReply({
                content: `❌ **Erro ao sair da call.**`
            });
        }
        
    } catch (error) {
        console.error("Erro ao sair da call:", error);
        await interaction.editReply({
            content: "❌ **Erro ao sair da call.**\nTente novamente."
        });
    }
}

export default new Command({
    name: "painelcall",
    description: "Exibe o painel de call para fixar no canal",
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
        ["painelcall:select", handlePainelSelect]
    ]),
    
    modals: new Collection([
        ["painelcall:modal_token", handleTokenModal],
        ["painelcall:modal_call", handleCallModal],
        ["painelcall:modal_call_muted", handleCallMutedModal]
    ])
});
