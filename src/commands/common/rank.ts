import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, CacheType, ButtonInteraction, Collection, ApplicationCommandType, DiscordAPIError } from "discord.js";
import { Command } from "../../structs/types/command";
import fs from 'fs';
import path from 'path';
import * as chokidar from 'chokidar';

const rankingsFilePath = path.join(__dirname, '../../data/ranking.json');


function loadRankings() {
    if (fs.existsSync(rankingsFilePath)) {
        const data = fs.readFileSync(rankingsFilePath, 'utf8');
        return JSON.parse(data);  // Retorna o objeto de pontuação
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

async function generateRankingPage(page: number, client: any, guildId: string) {
    const entries = Object.entries(rankings)
        .map(([userId, points]) => ({ userId, points }))
        .sort((a, b) => (b.points as number) - (a.points as number)); 

    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const topPlayers = (await Promise.all(
        entries.slice(startIndex, endIndex).map(async (player) => {
            try {
                const member = await client.guilds.cache.get(guildId)?.members.fetch(player.userId);
                if (member) {
                    return { ...player, displayName: member.displayName };
                }
                return null; 
            } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 10007) {
                    console.log(`Membro não encontrado no servidor: ${player.userId}`);
                } else {
                    console.error("Erro ao buscar o membro:", error);
                }
                return null; 
            }
        })
    )).filter((player) => player !== null);  

    const embed = new EmbedBuilder()
        .setTitle("Ranking de Pontos")
        .setDescription(`Top ${startIndex + 1} a ${Math.min(endIndex, entries.length)} jogadores com mais pontos:`)
        .setColor('#00FFFF')
        .addFields(
            ...topPlayers.map((player, index) => ({
                name: `${startIndex + index + 1}. ${player.displayName || "Desconhecido"}`,  
                value: `Pontos: ${player.points}`,
                inline: false  
            }))
        );

    const totalPages = Math.ceil(entries.length / pageSize);
    const nextPageDisabled = topPlayers.length < pageSize;

    return { embed, totalPages, nextPageDisabled };
}

export default new Command({
    name: "rank",
    description: "Exibe o ranking dos jogadores com mais pontos",
    type: ApplicationCommandType.ChatInput,
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
    async run({ interaction, client }) {
        if (interaction.options.get("tipo")?.value !== "times") return;

        if (!interaction.guildId) {
            await interaction.reply("Não foi possível obter a informação da guild.");
            return;
        }

        let page = 1; 

        const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, client, interaction.guildId);

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId("previousPage")
                    .setLabel("<")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1), 
                new ButtonBuilder()
                    .setCustomId("nextPage")
                    .setLabel(">")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(nextPageDisabled || page === totalPages),  
            ],
        });

        await interaction.reply({
            embeds: [embed],
            components: [row.toJSON()],
            fetchReply: true,
        });
    },

    buttons: new Collection([

        ['previousPage', async (interaction: ButtonInteraction<CacheType>) => {
            let page = parseInt(interaction.message.content.split("Página: ")[1] || "1");
            page--;  

            if (page < 1) return;  

            if (!interaction.guildId) {
                await interaction.reply("Não foi possível obter a informação da guild.");
                return;
            }

            const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, interaction.client, interaction.guildId);

            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId("previousPage")
                        .setLabel("<")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1), 
                    new ButtonBuilder()
                        .setCustomId("nextPage")
                        .setLabel(">")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(nextPageDisabled || page === totalPages),  
                ],
            });

            await interaction.update({
                embeds: [embed],
                components: [row.toJSON()],
            });
        }],

        ['nextPage', async (interaction: ButtonInteraction<CacheType>) => {
            let page = parseInt(interaction.message.content.split("Página: ")[1] || "1");
            page++;  

            if (!interaction.guildId) {
                await interaction.reply("Não foi possível obter a informação da guild.");
                return;
            }

            const { embed, totalPages, nextPageDisabled } = await generateRankingPage(page, interaction.client, interaction.guildId);

            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId("previousPage")
                        .setLabel("<")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1), 
                    new ButtonBuilder()
                        .setCustomId("nextPage")
                        .setLabel(">")
                        .setStyle(ButtonStyle.Primary)
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
