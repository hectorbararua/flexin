import { 
    ApplicationCommandOptionType, 
    ApplicationCommandType,
    CommandInteraction,
    CommandInteractionOptionResolver,
    GuildMember
} from 'discord.js';
import { Command } from '../../core/types';
import { influencerService } from './InfluencerService';
import { PostEmbedBuilder } from './PostEmbedBuilder';
import { INFLUENCER_ROLE_IDS, PLATFORM_CONFIGS, PROFILE_URL_PATTERNS } from './constants';
import { Platform } from './types';

const PLATFORM_CHOICES = [
    { name: 'TikTok', value: 'tiktok' },
    { name: 'YouTube', value: 'youtube' },
    { name: 'Roblox', value: 'roblox' },
];

export default new Command({
    name: 'perfil',
    description: 'Gerenciar seus perfis de redes sociais',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'adicionar',
            description: 'Adicionar um perfil de rede social',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'plataforma',
                    description: 'A plataforma do perfil',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: PLATFORM_CHOICES,
                },
                {
                    name: 'link',
                    description: 'O link do seu perfil (ex: https://tiktok.com/@seunome)',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'remover',
            description: 'Remover um perfil cadastrado',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'plataforma',
                    description: 'A plataforma do perfil a remover',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: PLATFORM_CHOICES,
                },
            ],
        },
        {
            name: 'listar',
            description: 'Ver seus perfis cadastrados',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],

    async run({ interaction, options }) {
        const member = interaction.member as GuildMember;
        const userId = interaction.user.id;

        if (!member.roles.cache.has(INFLUENCER_ROLE_IDS.INFLUENCER)) {
            await interaction.reply({
                content: '❌ Apenas influencers podem gerenciar perfis.',
                ephemeral: true,
            });
            return;
        }

        if (!influencerService.isInfluencer(userId)) {
            await interaction.reply({
                content: '❌ Você não está cadastrado como influencer.',
                ephemeral: true,
            });
            return;
        }

        const subcommand = options.getSubcommand();

        switch (subcommand) {
            case 'adicionar':
                await handleAdicionar(interaction, options);
                break;
            case 'remover':
                await handleRemover(interaction, options);
                break;
            case 'listar':
                await handleListar(interaction);
                break;
        }
    },
});

async function handleAdicionar(
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver
): Promise<void> {
    const platform = options.getString('plataforma', true) as Platform;
    const profileUrl = options.getString('link', true).trim().split('?')[0];
    const guild = interaction.guild;

    if (!guild) {
        await interaction.reply({
            content: '❌ Este comando só pode ser usado em um servidor.',
            ephemeral: true,
        });
        return;
    }

    const patterns = PROFILE_URL_PATTERNS[platform];
    const isValidUrl = patterns.some(pattern => pattern.test(profileUrl));

    if (!isValidUrl) {
        const config = PLATFORM_CONFIGS[platform];
        let example = '';
        
        switch (platform) {
            case 'tiktok':
                example = 'https://tiktok.com/@seunome';
                break;
            case 'youtube':
                example = 'https://youtube.com/@seunome';
                break;
            case 'roblox':
                example = 'https://www.roblox.com/users/123456789/profile';
                break;
        }

        await interaction.reply({
            content: `❌ Link inválido para ${config.name}.\n\n**Formato esperado:** \`${example}\``,
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const username = platform === 'roblox' ? 'roblox' : extractUsername(profileUrl, platform);

    if (!username && platform !== 'roblox') {
        await interaction.editReply({
            content: '❌ Não foi possível extrair o nome de usuário do link.',
        });
        return;
    }

    const profile = await influencerService.addProfile(
        interaction.user.id,
        platform,
        profileUrl,
        username || 'roblox',
        guild
    );

    const config = PLATFORM_CONFIGS[platform];
    const embed = PostEmbedBuilder.buildSuccessEmbed(
        'Perfil Cadastrado',
        `${config.emoji} **${config.name}**\n\n` +
        `Usuário: **${profile.username}**\n` +
        `Link: ${profile.profileUrl}\n\n` +
        `✅ Cargo de ${config.name} adicionado!`
    );

    await interaction.editReply({ embeds: [embed] });
}

async function handleRemover(
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver
): Promise<void> {
    const platform = options.getString('plataforma', true) as Platform;
    const guild = interaction.guild;

    if (!guild) {
        await interaction.reply({
            content: '❌ Este comando só pode ser usado em um servidor.',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const removed = await influencerService.removeProfile(interaction.user.id, platform, guild);

    if (removed) {
        const config = PLATFORM_CONFIGS[platform];
        const embed = PostEmbedBuilder.buildSuccessEmbed(
            'Perfil Removido',
            `${config.emoji} Seu perfil do **${config.name}** foi removido.\n\n` +
            `✅ Cargo de ${config.name} removido!`
        );
        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply({
            content: '❌ Você não tem um perfil dessa plataforma cadastrado.',
        });
    }
}

async function handleListar(
    interaction: CommandInteraction
): Promise<void> {
    const profiles = influencerService.getProfiles(interaction.user.id);
    const embed = PostEmbedBuilder.buildProfileListEmbed(interaction.user, profiles);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

function extractUsername(profileUrl: string, platform: Platform): string | null {
    const cleanUrl = profileUrl.split('?')[0];
    
    const patterns: Record<Platform, RegExp> = {
        tiktok: /@([\w.-]+)/,
        youtube: /(?:@|channel\/|c\/)([\w.-]+)/,
        roblox: /roblox\.com/,
    };

    const match = cleanUrl.match(patterns[platform]);
    return match ? match[1] : null;
}
