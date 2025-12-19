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
import { getSelfbotManager, SelfbotClient } from "../../lib/selfbot";
import * as fs from "fs";
import * as path from "path";

interface TokenClientData {
    odiscordId: string;
    odiscordUsername: string;
    token: string;
    selfbotClientId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TokenClientStore {
    [odiscordId: string]: TokenClientData;
}

const TOKEN_FILE_PATH = path.join(process.cwd(), "src/data/tokenClient.json");

function loadTokenStore(): TokenClientStore {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            const data = fs.readFileSync(TOKEN_FILE_PATH, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Erro ao carregar tokenClient.json:", error);
    }
    return {};
}

function saveTokenStore(store: TokenClientStore): void {
    try {
        fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
    } catch (error) {
        console.error("Erro ao salvar tokenClient.json:", error);
    }
}

function saveUserToken(
    odiscordId: string, 
    odiscordUsername: string, 
    token: string,
    selfbotClientId: string | null = null
): TokenClientData {
    const store = loadTokenStore();
    const now = new Date().toISOString();
    
    const existingData = store[odiscordId];
    
    store[odiscordId] = {
        odiscordId,
        odiscordUsername,
        token,
        selfbotClientId,
        createdAt: existingData?.createdAt || now,
        updatedAt: now
    };
    
    saveTokenStore(store);
    return store[odiscordId];
}   

function getUserToken(odiscordId: string): TokenClientData | null {
    const store = loadTokenStore();
    return store[odiscordId] || null;
}

function updateSelfbotClientId(odiscordId: string, selfbotClientId: string): void {
    const store = loadTokenStore();
    if (store[odiscordId]) {
        store[odiscordId].selfbotClientId = selfbotClientId;
        store[odiscordId].updatedAt = new Date().toISOString();
        saveTokenStore(store);
    }
}

async function ensureUserClient(userId: string, username: string): Promise<SelfbotClient | null> {
    const userData = getUserToken(userId);
    
    if (!userData || !userData.token) {
        return null;
    }
    
    const manager = getSelfbotManager();
    
    if (userData.selfbotClientId) {
        const existingClient = manager.getClient(userData.selfbotClientId);
        if (existingClient && existingClient.isReady()) {
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
    
    updateSelfbotClientId(userId, clientId);
    
    const client = manager.getClient(clientId);
    if (!client) {
        return null;
    }
    
    const loginSuccess = await client.login();
    
    if (!loginSuccess) {
        manager.removeClient(clientId);
        updateSelfbotClientId(userId, '');
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
                .setCustomId("painel:select")
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

async function handlePainelSelect(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const selected = interaction.values[0];
    const userId = interaction.user.id;
    
    switch (selected) {
        case "token":
            const tokenModal = new ModalBuilder()
                .setCustomId("painel:modal_token")
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
            await interaction.showModal(tokenModal);
            break;
            
        case "call":
        case "call_muted":
            const userData = getUserToken(userId);
            if (!userData || !userData.token) {
                await interaction.reply({
                    content: "❌ **Você precisa vincular sua token primeiro!**\nSelecione a opção `Token` no menu.",
                    ephemeral: true
                });
                return;
            }
            
            const isMuted = selected === "call_muted";
            const callModal = new ModalBuilder()
                .setCustomId(isMuted ? "painel:modal_call_muted" : "painel:modal_call")
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
            await interaction.showModal(callModal);
            break;
            
        case "sair":
            await handleLeaveCall(interaction);
            break;
            
        default:
            await interaction.reply({
                content: "❌ Opção não reconhecida.",
                ephemeral: true
            });
    }
}

async function handleTokenModal(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
    const token = interaction.fields.getTextInputValue("token_input");
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const manager = getSelfbotManager();
        
        const existingData = getUserToken(userId);
        if (existingData?.selfbotClientId) {
            const existingClient = manager.getClient(existingData.selfbotClientId);
            if (existingClient) {
                manager.removeClient(existingData.selfbotClientId);
            }
        }
        
        saveUserToken(userId, username, token);
        
        const clientId = manager.addClient({
            token: token,
            label: `${username}-${userId.slice(-4)}`
        });
        
        updateSelfbotClientId(userId, clientId);
        
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
            updateSelfbotClientId(userId, '');
            
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
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
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
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
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
    name: "painel",
    description: "Exibe o painel de call para fixar no canal",
    type: ApplicationCommandType.ChatInput,
    async run({ interaction }) {
        const embed = buildPainelEmbed();
        const selectMenu = buildSelectMenu();
        
        await interaction.reply({
            embeds: [embed],
            components: [selectMenu.toJSON()]
        });
    },
    
    selects: new Collection([
        ["painel:select", handlePainelSelect]
    ]),
    
    modals: new Collection([
        ["painel:modal_token", handleTokenModal],
        ["painel:modal_call", handleCallModal],
        ["painel:modal_call_muted", handleCallMutedModal]
    ])
});
