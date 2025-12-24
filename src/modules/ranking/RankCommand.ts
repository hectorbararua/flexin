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
            choices: [{ name: 'times', value: 'times' }],
        },
    ],

    async run({ interaction, client, options }) {
        if (options.get('tipo')?.value !== 'times') return;

        if (!interaction.guildId) {
            await interaction.reply('Não foi possível obter a informação da guild.');
            return;
        }

        const page = 1;
        const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
            page, 
            client, 
            interaction.guildId
        );

        const row = buildPaginationRow(page, totalPages, nextPageDisabled);

        await interaction.reply({
            embeds: [embed],
            components: [row.toJSON()],
        });
    },

    buttons: new Collection([
        ['previousPage', handlePreviousPage],
        ['nextPage', handleNextPage],
    ]),
});

async function handlePreviousPage(interaction: ButtonInteraction<CacheType>): Promise<void> {
    let page = parseInt(interaction.message.content.split('Página: ')[1] || '1');
    page--;

    if (page < 1) return;

    if (!interaction.guildId) {
        await interaction.reply('Não foi possível obter a informação da guild.');
        return;
    }

    const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
        page,
        interaction.client,
        interaction.guildId
    );

    const row = buildPaginationRow(page, totalPages, nextPageDisabled);

    await interaction.update({
        embeds: [embed],
        components: [row.toJSON()],
    });
}

async function handleNextPage(interaction: ButtonInteraction<CacheType>): Promise<void> {
    let page = parseInt(interaction.message.content.split('Página: ')[1] || '1');
    page++;

    if (!interaction.guildId) {
        await interaction.reply('Não foi possível obter a informação da guild.');
        return;
    }

    const { embed, totalPages, nextPageDisabled } = await rankingService.generateRankingPage(
        page,
        interaction.client,
        interaction.guildId
    );

    const row = buildPaginationRow(page, totalPages, nextPageDisabled);

    await interaction.update({
        embeds: [embed],
        components: [row.toJSON()],
    });
}

function buildPaginationRow(
    page: number, 
    totalPages: number, 
    nextPageDisabled: boolean
): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId('previousPage')
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(nextPageDisabled || page === totalPages),
        ],
    });
}

