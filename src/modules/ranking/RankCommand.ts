import { 
    ActionRowBuilder, 
    ApplicationCommandType, 
    ButtonBuilder, 
    ButtonStyle, 
    CacheType, 
    ButtonInteraction, 
    Collection 
} from 'discord.js';
import { Command } from '../../core/types';
import { RankingService } from './RankingService';
import { RankingType } from './RankingRepository';

const rankingService = new RankingService();

export default new Command({
    name: 'rank',
    description: 'Exibe o ranking dos jogadores com mais pontos',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: 3,
            name: 'tipo',
            description: 'Escolha o tipo de ranking',
            required: true,
            choices: [
                { name: '🎮 Times (Normal)', value: 'normal' },
                { name: '🎀 Times (Feminino)', value: 'feminino' },
            ],
        },
    ],

    async run({ interaction, client, options }) {
        const tipo = options.getString('tipo') as RankingType;
        if (!tipo) return;

        if (!interaction.guildId) {
            await interaction.reply('Não foi possível obter a informação da guild.');
            return;
        }

        await interaction.deferReply();

        const page = 1;
        const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
            page, 
            client, 
            interaction.guildId,
            tipo
        );

        const row = buildPaginationRow(page, totalPages, nextPageDisabled, tipo);

        // Também atualiza o ranking no canal dedicado
        await rankingService.sendRankingUpdate(client, tipo);

        await interaction.editReply({
            embeds: [embed],
            components: [row.toJSON()],
        });
    },

    buttons: new Collection([
        ['previousPage_normal', (i) => handlePreviousPage(i, 'normal')],
        ['nextPage_normal', (i) => handleNextPage(i, 'normal')],
        ['previousPage_feminino', (i) => handlePreviousPage(i, 'feminino')],
        ['nextPage_feminino', (i) => handleNextPage(i, 'feminino')],
    ]),
});

async function handlePreviousPage(interaction: ButtonInteraction<CacheType>, tipo: RankingType): Promise<void> {
    const currentEmbed = interaction.message.embeds[0];
    const pageMatch = currentEmbed?.description?.match(/Top (\d+)/);
    let page = pageMatch ? Math.ceil(parseInt(pageMatch[1]) / 10) : 1;
    page--;

    if (page < 1) return;

    if (!interaction.guildId) {
        await interaction.reply('Não foi possível obter a informação da guild.');
        return;
    }

    const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
        page,
        interaction.client,
        interaction.guildId,
        tipo
    );

    const row = buildPaginationRow(page, totalPages, nextPageDisabled, tipo);

    await interaction.update({
        embeds: [embed],
        components: [row.toJSON()],
    });
}

async function handleNextPage(interaction: ButtonInteraction<CacheType>, tipo: RankingType): Promise<void> {
    const currentEmbed = interaction.message.embeds[0];
    const pageMatch = currentEmbed?.description?.match(/Top (\d+)/);
    let page = pageMatch ? Math.ceil(parseInt(pageMatch[1]) / 10) : 1;
    page++;

    if (!interaction.guildId) {
        await interaction.reply('Não foi possível obter a informação da guild.');
        return;
    }

    const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
        page,
        interaction.client,
        interaction.guildId,
        tipo
    );

    const row = buildPaginationRow(page, totalPages, nextPageDisabled, tipo);

    await interaction.update({
        embeds: [embed],
        components: [row.toJSON()],
    });
}

function buildPaginationRow(
    page: number, 
    totalPages: number, 
    nextPageDisabled: boolean,
    tipo: RankingType
): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId(`previousPage_${tipo}`)
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`nextPage_${tipo}`)
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(nextPageDisabled || page === totalPages),
        ],
    });
}

