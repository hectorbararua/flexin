import {
    Message,
    TextChannel,
    ThreadChannel
} from 'discord.js';
import { PostRepository, postRepository } from './PostRepository';
import { ProfileRepository, profileRepository } from './ProfileRepository';
import { InfluencerRepository, influencerRepository } from './InfluencerRepository';
import { PostEmbedBuilder } from './PostEmbedBuilder';
import { PostButtonBuilder } from './PostButtonBuilder';
import { PLATFORM_CONFIGS, INFLUENCER_ROLE_IDS } from './constants';
import { Platform, Post, ValidationResult } from './types';
import { channelConfig } from '../../config/ChannelConfigService';

export class PostService {
    constructor(
        private postRepo: PostRepository = postRepository,
        private profileRepo: ProfileRepository = profileRepository,
        private influencerRepo: InfluencerRepository = influencerRepository
    ) { }

    getConfiguredChannels(): string[] {
        return [
            channelConfig.influencer.tiktokChannelId,
            channelConfig.influencer.youtubeChannelId,
        ].filter(id => id !== '');
    }

    isConfiguredChannel(channelId: string): boolean {
        return this.getConfiguredChannels().includes(channelId);
    }

    getPlatformByChannel(channelId: string): Platform | null {
        if (channelId === channelConfig.influencer.tiktokChannelId) return 'tiktok';
        if (channelId === channelConfig.influencer.youtubeChannelId) return 'youtube';
        return null;
    }

    validateMessage(message: Message): ValidationResult {
        const authorId = message.author.id;
        const channelId = message.channel.id;
        const content = message.content;

        const member = message.member;
        if (!member?.roles.cache.has(INFLUENCER_ROLE_IDS.INFLUENCER)) {
            return { valid: false, error: 'Você não tem permissão para postar neste canal.' };
        }

        if (!this.influencerRepo.exists(authorId)) {
            return { valid: false, error: 'Você não está cadastrado como influencer.' };
        }

        const expectedPlatform = this.getPlatformByChannel(channelId);
        if (!expectedPlatform) {
            return { valid: false, error: 'Canal não configurado para posts.' };
        }

        const videoUrl = this.extractVideoUrl(content, expectedPlatform);
        if (!videoUrl) {
            return {
                valid: false,
                error: `Você precisa incluir um link válido do ${PLATFORM_CONFIGS[expectedPlatform].name}.`
            };
        }

        if (!this.profileRepo.isVideoFromRegisteredProfile(authorId, videoUrl, expectedPlatform)) {
            const profile = this.profileRepo.getByPlatform(authorId, expectedPlatform);
            if (!profile) {
                return {
                    valid: false,
                    error: `Você precisa cadastrar seu perfil do ${PLATFORM_CONFIGS[expectedPlatform].name} primeiro. Use \`/perfil adicionar\`.`
                };
            }
            return {
                valid: false,
                error: 'O vídeo não pertence ao seu perfil cadastrado.'
            };
        }

        const description = this.extractDescription(content, videoUrl);

        return {
            valid: true,
            platform: expectedPlatform,
            videoUrl,
            description,
        };
    }

    private extractVideoUrl(content: string, platform: Platform): string | null {
        const config = PLATFORM_CONFIGS[platform];

        for (const pattern of config.urlPatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return null;
    }

    private extractDescription(content: string, videoUrl: string): string {
        let description = content.replace(videoUrl, '');
        description = description.replace(/[?&][\w=-]+/g, '');
        description = description.replace(/https?:\/\/\S*/g, '');
        description = description.replace(/\s+/g, ' ').trim();

        return description;
    }

    async createOfficialPost(
        message: Message,
        platform: Platform,
        videoUrl: string,
        description: string
    ): Promise<{ success: boolean; message?: Message; error?: string }> {
        const channel = message.channel as TextChannel;
        const author = message.author;

        try {
            await message.delete();

            const profiles = this.profileRepo.getByUser(author.id);

            const buttons = PostButtonBuilder.buildPostButtons(
                videoUrl,
                profiles,
                0
            );

            const platformConfig = PLATFORM_CONFIGS[platform];

            let content = `@everyone\n\n`;
            content += `🎬 **Nova publicação de <@${author.id}>!**\n\n`;

            if (description && description.length > 0) {
                content += `💬 ${description}\n\n`;
            }

            content += `${platformConfig.emoji} **Assista agora e deixe seu like!**\n`;
            content += videoUrl;

            const officialMessage = await channel.send({
                content,
                components: buttons.map(row => row.toJSON()),
            });

            this.postRepo.create(
                officialMessage.id,
                channel.id,
                author.id,
                platform,
                videoUrl,
                description
            );

            return { success: true, message: officialMessage };
        } catch (error) {
            console.error('Error creating official post:', error);
            return { success: false, error: 'Erro ao criar o post oficial.' };
        }
    }

    async handleLike(messageId: string, userId: string): Promise<{ liked: boolean; count: number } | null> {
        const post = this.postRepo.get(messageId);
        if (!post) return null;

        return this.postRepo.toggleLike(messageId, userId);
    }

    async createCommentThread(message: Message, authorId: string): Promise<ThreadChannel | null> {
        const post = this.postRepo.get(message.id);
        if (!post) return null;

        if (post.threadId) {
            try {
                const thread = await message.channel.messages.fetch(post.threadId);
                return thread?.thread || null;
            } catch {}
        }

        try {
            const thread = await message.startThread({
                name: `💬 Comentários`,
                autoArchiveDuration: 1440,
            });

            this.postRepo.setThreadId(message.id, thread.id);
            return thread;
        } catch (error) {
            console.error('Error creating thread:', error);
            return null;
        }
    }

    async deletePost(
        messageId: string,
        userId: string,
        isAdmin: boolean,
        channel: TextChannel
    ): Promise<{ success: boolean; error?: string }> {
        const post = this.postRepo.get(messageId);
        if (!post) {
            return { success: false, error: 'Post não encontrado.' };
        }

        if (!isAdmin && post.authorId !== userId) {
            return { success: false, error: 'Você só pode deletar seus próprios posts.' };
        }

        try {
            const message = await channel.messages.fetch(messageId);
            await message.delete();
            this.postRepo.delete(messageId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting post:', error);
            return { success: false, error: 'Erro ao deletar o post.' };
        }
    }

    getPost(messageId: string): Post | undefined {
        return this.postRepo.get(messageId);
    }
}

export const postService = new PostService();
