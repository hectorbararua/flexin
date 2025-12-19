"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const command_1 = require("../../structs/types/command");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const chokidar = tslib_1.__importStar(require("chokidar"));
const rankingsFilePath = path_1.default.join(__dirname, '../../data/ranking.json');
function loadRankings() {
    if (fs_1.default.existsSync(rankingsFilePath)) {
        const data = fs_1.default.readFileSync(rankingsFilePath, 'utf8');
        return JSON.parse(data); // Retorna o objeto de pontuação
    }
    return {};
}
let rankings = loadRankings();
const watcher = chokidar.watch(rankingsFilePath, {
    persistent: true,
});
watcher.on('change', () => {
    rankings = loadRankings();
    console.log('Rankings atualizados:', rankings);
});
async function generateRankingPage(page, client, guildId) {
    const entries = Object.entries(rankings)
        .map(([userId, points]) => ({ userId, points }))
        .sort((a, b) => b.points - a.points);
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const topPlayers = (await Promise.all(entries.slice(startIndex, endIndex).map(async (player) => {
        try {
            const member = await client.guilds.cache.get(guildId)?.members.fetch(player.userId);
            if (member) {
                return { ...player, displayName: member.displayName };
            }
            return null;
        }
        catch (error) {
            if (error instanceof discord_js_1.DiscordAPIError && error.code === 10007) {
                console.log(`Membro não encontrado no servidor: ${player.userId}`);
            }
            else {
                console.error("Erro ao buscar o membro:", error);
            }
            return null;
        }
    }))).filter((player) => player !== null);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("Ranking de Pontos")
        .setDescription(`Top ${startIndex + 1} a ${Math.min(endIndex, entries.length)} jogadores com mais pontos:`)
        .setColor('#00FFFF')
        .addFields(...topPlayers.map((player, index) => ({
        name: `${startIndex + index + 1}. ${player.displayName || "Desconhecido"}`,
        value: `Pontos: ${player.points}`,
        inline: false
    })));
    const totalPages = Math.ceil(entries.length / pageSize);
    const nextPageDisabled = topPlayers.length < pageSize;
    return { embed, totalPages, nextPageDisabled };
}
exports.default = new command_1.Command({
    name: "rank",
    description: "Exibe o ranking dos jogadores com mais pontos",
    type: discord_js_1.ApplicationCommandType.ChatInput,
    options: [
        {
            type: 3,
            name: "tipo",
            description: "Escolha o tipo de ranking",
            required: true,
            choices: [
                { name: "times", value: "times" },
            ],
        },
    ],
    async run({ interaction, client, options }) {
        if (options.get("tipo")?.value !== "times")
            return;
        if (!interaction.guildId) {
            await interaction.reply("Não foi possível obter a informação da guild.");
            return;
        }
        let page = 1;
        const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, client, interaction.guildId);
        const row = new discord_js_1.ActionRowBuilder({
            components: [
                new discord_js_1.ButtonBuilder()
                    .setCustomId("previousPage")
                    .setLabel("<")
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new discord_js_1.ButtonBuilder()
                    .setCustomId("nextPage")
                    .setLabel(">")
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setDisabled(nextPageDisabled || page === totalPages),
            ],
        });
        await interaction.reply({
            embeds: [embed],
            components: [row.toJSON()],
            fetchReply: true,
        });
    },
    buttons: new discord_js_1.Collection([
        ['previousPage', async (interaction) => {
                let page = parseInt(interaction.message.content.split("Página: ")[1] || "1");
                page--;
                if (page < 1)
                    return;
                if (!interaction.guildId) {
                    await interaction.reply("Não foi possível obter a informação da guild.");
                    return;
                }
                const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, interaction.client, interaction.guildId);
                const row = new discord_js_1.ActionRowBuilder({
                    components: [
                        new discord_js_1.ButtonBuilder()
                            .setCustomId("previousPage")
                            .setLabel("<")
                            .setStyle(discord_js_1.ButtonStyle.Primary)
                            .setDisabled(page === 1),
                        new discord_js_1.ButtonBuilder()
                            .setCustomId("nextPage")
                            .setLabel(">")
                            .setStyle(discord_js_1.ButtonStyle.Primary)
                            .setDisabled(nextPageDisabled || page === totalPages),
                    ],
                });
                await interaction.update({
                    embeds: [embed],
                    components: [row.toJSON()],
                });
            }],
        ['nextPage', async (interaction) => {
                let page = parseInt(interaction.message.content.split("Página: ")[1] || "1");
                page++;
                if (!interaction.guildId) {
                    await interaction.reply("Não foi possível obter a informação da guild.");
                    return;
                }
                const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, interaction.client, interaction.guildId);
                const row = new discord_js_1.ActionRowBuilder({
                    components: [
                        new discord_js_1.ButtonBuilder()
                            .setCustomId("previousPage")
                            .setLabel("<")
                            .setStyle(discord_js_1.ButtonStyle.Primary)
                            .setDisabled(page === 1),
                        new discord_js_1.ButtonBuilder()
                            .setCustomId("nextPage")
                            .setLabel(">")
                            .setStyle(discord_js_1.ButtonStyle.Primary)
                            .setDisabled(nextPageDisabled || page === totalPages),
                    ],
                });
                await interaction.update({
                    embeds: [embed],
                    components: [row.toJSON()],
                });
            }],
    ])
});
