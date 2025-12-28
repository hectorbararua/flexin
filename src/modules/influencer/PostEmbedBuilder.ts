import { EmbedBuilder, User } from 'discord.js';
import { Platform, Profile } from './types';
import { PLATFORM_CONFIGS, POST_COLORS } from './constants';

export class PostEmbedBuilder {
    static buildPostEmbed(
        author: User,
        platform: Platform,
        description: string,
        videoUrl: string,
        profiles: Profile[]
    ): EmbedBuilder {
        const config = PLATFORM_CONFIGS[platform];
        const color = this.getColorForPlatform(platform);
        const timestamp = new Date();

        const embed = new EmbedBuilder()
            .setColor(color as `#${string}`)
            .setAuthor({
                name: author.displayName || author.username,
                iconURL: author.displayAvatarURL(),
            })
            .setTimestamp(timestamp)
            .setFooter({
                text: `${config.emoji} ${config.name}`,
            });

        if (description) {
            embed.setDescription(description);
        }

        const profileLinks = profiles
            .map(p => `${PLATFORM_CONFIGS[p.platform].emoji} [${PLATFORM_CONFIGS[p.platform].name}](${p.profileUrl})`)
            .join(' • ');

        if (profileLinks) {
            embed.addFields({
                name: '🔗 Perfis',
                value: profileLinks,
                inline: false,
            });
        }

        return embed;
    }

    static buildInfluencerListEmbed(
        influencers: Array<{ discordId: string; displayName: string; addedAt: string }>
    ): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle('📋 Lista de Influencers')
            .setColor(POST_COLORS.DEFAULT as `#${string}`)
            .setTimestamp();

        if (influencers.length === 0) {
            embed.setDescription('Nenhum influencer cadastrado.');
            return embed;
        }

        const description = influencers
            .map((inf, index) => {
                const date = new Date(inf.addedAt).toLocaleDateString('pt-BR');
                return `**${index + 1}.** <@${inf.discordId}> - Desde ${date}`;
            })
            .join('\n');

        embed.setDescription(description);
        embed.setFooter({ text: `Total: ${influencers.length} influencer(s)` });

        return embed;
    }

    static buildProfileListEmbed(
        user: User,
        profiles: Profile[]
    ): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`📱 Perfis de ${user.displayName || user.username}`)
            .setColor(POST_COLORS.DEFAULT as `#${string}`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        if (profiles.length === 0) {
            embed.setDescription('Nenhum perfil cadastrado.\nUse `/perfil adicionar` para cadastrar.');
            return embed;
        }

        for (const profile of profiles) {
            const config = PLATFORM_CONFIGS[profile.platform];
            const date = new Date(profile.addedAt).toLocaleDateString('pt-BR');
            
            embed.addFields({
                name: `${config.emoji} ${config.name}`,
                value: `[${profile.username}](${profile.profileUrl})\nCadastrado em: ${date}`,
                inline: true,
            });
        }

        return embed;
    }

    static buildSuccessEmbed(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setColor('#00FF00')
            .setTimestamp();
    }

    static buildErrorEmbed(title: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setColor('#FF0000')
            .setTimestamp();
    }

    private static getColorForPlatform(platform: Platform): string {
        switch (platform) {
            case 'tiktok':
                return POST_COLORS.TIKTOK;
            case 'youtube':
                return POST_COLORS.YOUTUBE;
            default:
                return POST_COLORS.DEFAULT;
        }
    }
}
