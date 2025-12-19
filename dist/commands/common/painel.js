"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const command_1 = require("../../structs/types/command");
const selfbot_1 = require("../../lib/selfbot");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const TOKEN_FILE_PATH = path.join(process.cwd(), "src/data/tokenClient.json");
function loadTokenStore() {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            const data = fs.readFileSync(TOKEN_FILE_PATH, "utf8");
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error("Erro ao carregar tokenClient.json:", error);
    }
    return {};
}
function saveTokenStore(store) {
    try {
        fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
    }
    catch (error) {
        console.error("Erro ao salvar tokenClient.json:", error);
    }
}
function saveUserToken(odiscordId, odiscordUsername, token, selfbotClientId = null) {
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
function getUserToken(odiscordId) {
    const store = loadTokenStore();
    return store[odiscordId] || null;
}
function updateSelfbotClientId(odiscordId, selfbotClientId) {
    const store = loadTokenStore();
    if (store[odiscordId]) {
        store[odiscordId].selfbotClientId = selfbotClientId;
        store[odiscordId].updatedAt = new Date().toISOString();
        saveTokenStore(store);
    }
}
async function ensureUserClient(userId, username) {
    const userData = getUserToken(userId);
    if (!userData || !userData.token) {
        return null;
    }
    const manager = (0, selfbot_1.getSelfbotManager)();
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
function buildPainelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setTitle("📞 Painel Call")
        .setDescription(`**📋 Como funciona:**\n` +
        `O sistema funciona por chamadas de servidor ou privadas. Antes de usar, é necessário vincular sua token no botão abaixo "\`Token\`", que ficará fixa na call.\n\n` +
        `**✏️ Como usar:**\n` +
        `Ao clicar no botão "\`Call\`", será aberto um painel onde você deverá inserir o ID da call ou o ID do usuário para entrar na chamada.\n\n` +
        `• **Para servidor** → insira o ID da call\n` +
        `• **Para pessoa** → insira o ID do usuário\n\n` +
        `> **Observação:**\n` +
        `> Caso ocorra algum erro, abra um ticket ou verifique se sua token está no servidor correto.\n\n` +
        `**🔊 Sair da call:**\n` +
        `Para sair da call a qualquer momento, use o comando:\n` +
        `\`/leave\` ou \`/sair\``)
        .setColor('#4B3B6A');
}
function buildSelectMenu() {
    return new discord_js_1.ActionRowBuilder({
        components: [
            new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("painel:select")
                .setPlaceholder("Selecione uma opção")
                .addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel("Token")
                .setDescription("Vincular sua token")
                .setValue("token")
                .setEmoji("🔑"), new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel("Call")
                .setDescription("Entrar desmutado na call")
                .setValue("call")
                .setEmoji("📞"), new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel("Call Mutado")
                .setDescription("Entrar mutado na call")
                .setValue("call_muted")
                .setEmoji("🔇"), new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel("Sair")
                .setDescription("Sair da call atual")
                .setValue("sair")
                .setEmoji("🚪"))
        ]
    });
}
async function handlePainelSelect(interaction) {
    const selected = interaction.values[0];
    const userId = interaction.user.id;
    switch (selected) {
        case "token":
            const tokenModal = new discord_js_1.ModalBuilder()
                .setCustomId("painel:modal_token")
                .setTitle("Vincular Token")
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId("token_input")
                .setLabel("Insira sua Token")
                .setPlaceholder("Cole sua token aqui...")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)));
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
            const callModal = new discord_js_1.ModalBuilder()
                .setCustomId(isMuted ? "painel:modal_call_muted" : "painel:modal_call")
                .setTitle(isMuted ? "Entrar na Call (Mutado)" : "Entrar na Call")
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId("call_id_input")
                .setLabel("ID da Call ou do Usuário")
                .setPlaceholder("Insira o ID aqui...")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)));
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
async function handleTokenModal(interaction) {
    const token = interaction.fields.getTextInputValue("token_input");
    const userId = interaction.user.id;
    const username = interaction.user.username;
    await interaction.deferReply({ ephemeral: true });
    try {
        const manager = (0, selfbot_1.getSelfbotManager)();
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
        }
        else {
            manager.removeClient(clientId);
            updateSelfbotClientId(userId, '');
            await interaction.editReply({
                content: `❌ **Falha ao conectar!**\n\n` +
                    `Verifique se sua token está correta e tente novamente.\n` +
                    `> Dica: A token deve ser válida e a conta não pode estar desativada.`
            });
        }
    }
    catch (error) {
        console.error("Erro ao vincular token:", error);
        await interaction.editReply({
            content: "❌ **Erro ao vincular token.**\nTente novamente mais tarde."
        });
    }
}
async function handleCallModal(interaction) {
    await processCallModal(interaction, false);
}
async function handleCallMutedModal(interaction) {
    await processCallModal(interaction, true);
}
async function processCallModal(interaction, isMuted) {
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
        }
        else {
            await interaction.editReply({
                content: `❌ **Falha ao entrar na call!**\n\n` +
                    `Verifique se:\n` +
                    `• O ID está correto\n` +
                    `• Sua conta tem acesso ao canal\n` +
                    `• O canal é de voz`
            });
        }
    }
    catch (error) {
        console.error("Erro ao entrar na call:", error);
        await interaction.editReply({
            content: "❌ **Erro ao entrar na call.**\nTente novamente mais tarde."
        });
    }
}
async function handleLeaveCall(interaction) {
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
        }
        else {
            await interaction.editReply({
                content: `❌ **Erro ao sair da call.**`
            });
        }
    }
    catch (error) {
        console.error("Erro ao sair da call:", error);
        await interaction.editReply({
            content: "❌ **Erro ao sair da call.**\nTente novamente."
        });
    }
}
exports.default = new command_1.Command({
    name: "painel",
    description: "Exibe o painel de call para fixar no canal",
    type: discord_js_1.ApplicationCommandType.ChatInput,
    async run({ interaction }) {
        const embed = buildPainelEmbed();
        const selectMenu = buildSelectMenu();
        await interaction.reply({
            embeds: [embed],
            components: [selectMenu.toJSON()]
        });
    },
    selects: new discord_js_1.Collection([
        ["painel:select", handlePainelSelect]
    ]),
    modals: new discord_js_1.Collection([
        ["painel:modal_token", handleTokenModal],
        ["painel:modal_call", handleCallModal],
        ["painel:modal_call_muted", handleCallMutedModal]
    ])
});
