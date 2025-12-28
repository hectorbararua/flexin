import { 
    ApplicationCommandOptionType, 
    ApplicationCommandType,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Guild,
    GuildMember
} from 'discord.js';
import { Command } from '../../core/types';
import { influencerService } from './InfluencerService';
import { PostEmbedBuilder } from './PostEmbedBuilder';
import { INFLUENCER_ROLE_IDS } from './constants';

export default new Command({
    name: 'influencer',
    description: 'Gerenciar influencers',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'adicionar',
            description: 'Adicionar um novo influencer',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'usuario',
                    description: 'O usuário a ser adicionado como influencer',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'remover',
            description: 'Remover um influencer',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'usuario',
                    description: 'O usuário a ser removido',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'listar',
            description: 'Listar todos os influencers',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],

    async run({ interaction, options }) {
        const member = interaction.member as GuildMember;
        
        if (!member.roles.cache.has(INFLUENCER_ROLE_IDS.ADMIN)) {
            await interaction.reply({
                content: '❌ Você não tem permissão para gerenciar influencers.',
                ephemeral: true,
            });
            return;
        }

        const subcommand = options.getSubcommand();
        const guild = interaction.guild;

        if (!guild) {
            await interaction.reply({
                content: '❌ Este comando só pode ser usado em um servidor.',
                ephemeral: true,
            });
            return;
        }

        switch (subcommand) {
            case 'adicionar':
                await handleAdicionar(interaction, options, guild);
                break;
            case 'remover':
                await handleRemover(interaction, options, guild);
                break;
            case 'listar':
                await handleListar(interaction, guild);
                break;
        }
    },
});

async function handleAdicionar(
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver,
    guild: Guild
): Promise<void> {
    const user = options.getUser('usuario', true);

    if (user.bot) {
        await interaction.reply({
            content: '❌ Você não pode adicionar um bot como influencer.',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const result = await influencerService.addInfluencer(
        user.id,
        interaction.user.id,
        guild
    );

    if (result.success) {
        const embed = PostEmbedBuilder.buildSuccessEmbed(
            'Influencer Adicionado',
            `<@${user.id}> foi adicionado como influencer!\n\nAgora ele pode cadastrar seus perfis usando \`/perfil adicionar\`.`
        );
        await interaction.editReply({ embeds: [embed] });
    } else {
        const embed = PostEmbedBuilder.buildErrorEmbed('Erro', result.message);
        await interaction.editReply({ embeds: [embed] });
    }
}

async function handleRemover(
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver,
    guild: Guild
): Promise<void> {
    const user = options.getUser('usuario', true);

    await interaction.deferReply({ ephemeral: true });

    const result = await influencerService.removeInfluencer(user.id, guild);

    if (result.success) {
        const embed = PostEmbedBuilder.buildSuccessEmbed(
            'Influencer Removido',
            `<@${user.id}> foi removido da lista de influencers.\nTodos os perfis cadastrados foram removidos.`
        );
        await interaction.editReply({ embeds: [embed] });
    } else {
        const embed = PostEmbedBuilder.buildErrorEmbed('Erro', result.message);
        await interaction.editReply({ embeds: [embed] });
    }
}

async function handleListar(
    interaction: CommandInteraction,
    guild: Guild
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const influencers = influencerService.getAllInfluencers();
    
    const influencerList = await Promise.all(
        influencers.map(async (inf) => {
            let displayName = 'Desconhecido';
            try {
                const member = await guild.members.fetch(inf.discordId);
                displayName = member.displayName || member.user.username;
            } catch {}
            return {
                discordId: inf.discordId,
                displayName,
                addedAt: inf.addedAt,
            };
        })
    );

    const embed = PostEmbedBuilder.buildInfluencerListEmbed(influencerList);
    await interaction.editReply({ embeds: [embed] });
}
