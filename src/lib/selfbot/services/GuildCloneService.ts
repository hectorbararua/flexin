import { Client, Guild, GuildChannel, Role, Permissions, TextChannel, VoiceChannel, CategoryChannel } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';

export interface CloneResult {
    readonly success: boolean;
    readonly isAdmin: boolean;
    readonly categoriesCreated: number;
    readonly channelsCreated: number;
    readonly rolesCreated: number;
    readonly emojisCreated: number;
    readonly errors: number;
    readonly stopped: boolean;
    readonly errorType?: 'SOURCE_NOT_FOUND' | 'TARGET_NOT_FOUND' | 'NO_PERMISSION' | 'GENERIC';
}

interface ChannelData {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly position: number;
    readonly parentId: string | null;
    readonly topic?: string | null;
    readonly nsfw?: boolean;
    readonly rateLimitPerUser?: number;
    readonly bitrate?: number;
    readonly userLimit?: number;
}

interface RoleData {
    readonly name: string;
    readonly color: number;
    readonly hoist: boolean;
    readonly position: number;
    readonly permissions: Permissions;
    readonly mentionable: boolean;
}

interface CloneProgress {
    categoriesCreated: number;
    channelsCreated: number;
    rolesCreated: number;
    emojisCreated: number;
    errors: number;
}

type ProgressCallback = (message: string) => Promise<void>;

const CLONE_DELAY = 1500;
const EMOJI_DELAY = 2000;

const SUPPORTED_CHANNEL_TYPES = new Set([
    'GUILD_TEXT',
    'GUILD_VOICE',
    'GUILD_CATEGORY'
]);

const SKIP_CHANNEL_TYPES = new Set([
    'GUILD_NEWS',
    'GUILD_NEWS_THREAD',
    'GUILD_PUBLIC_THREAD',
    'GUILD_PRIVATE_THREAD',
    'GUILD_STAGE_VOICE',
    'GUILD_FORUM',
    'GUILD_DIRECTORY'
]);

export class GuildCloneService {
    private readonly logger = Logger.child('[GuildClone]');
    private isRunning = false;
    private shouldStop = false;
    private readonly categoryMap = new Map<string, string>();

    isCloning(): boolean {
        return this.isRunning;
    }

    stop(): void {
        this.shouldStop = true;
        this.logger.info('Clonagem interrompida pelo usuário');
    }

    async clone(
        client: Client,
        sourceGuildId: string,
        targetGuildId: string,
        onProgress?: ProgressCallback
    ): Promise<CloneResult> {
        this.reset();
        this.isRunning = true;

        const progress: CloneProgress = {
            categoriesCreated: 0,
            channelsCreated: 0,
            rolesCreated: 0,
            emojisCreated: 0,
            errors: 0
        };

        try {
            const sourceGuild = await this.fetchGuild(client, sourceGuildId);
            if (!sourceGuild) {
                return this.buildResult(progress, false, false, 'SOURCE_NOT_FOUND');
            }

            const targetGuild = await this.fetchGuild(client, targetGuildId);
            if (!targetGuild) {
                return this.buildResult(progress, false, false, 'TARGET_NOT_FOUND');
            }

            const hasTargetPermission = this.checkAdminPermission(targetGuild, client.user?.id);
            if (!hasTargetPermission) {
                this.logger.error('Sem permissão de ADMIN no servidor de destino');
                return this.buildResult(progress, false, false, 'NO_PERMISSION');
            }

            const isAdmin = this.checkAdminPermission(sourceGuild, client.user?.id);
            
            await onProgress?.(`🔍 Analisando servidor origem...\n${isAdmin ? '✅ Você é ADMIN - Clonagem completa' : '⚠️ Não é ADMIN - Clonando apenas o visível'}`);

            if (isAdmin) {
                await this.cloneRoles(sourceGuild, targetGuild, progress, onProgress);
            }

            await this.cloneCategories(sourceGuild, targetGuild, progress, onProgress);
            await this.cloneChannels(sourceGuild, targetGuild, progress, onProgress);
            await this.cloneEmojis(sourceGuild, targetGuild, progress, onProgress);

            return this.buildResult(progress, true, isAdmin);
        } catch (error) {
            this.logger.error(`Erro na clonagem: ${error}`);
            return this.buildResult(progress, false, false, 'GENERIC');
        } finally {
            this.isRunning = false;
        }
    }

    private reset(): void {
        this.shouldStop = false;
        this.categoryMap.clear();
    }

    private async fetchGuild(client: Client, guildId: string): Promise<Guild | null> {
        try {
            return await client.guilds.fetch(guildId);
        } catch (error) {
            this.logger.error(`Servidor não encontrado: ${guildId}`);
            return null;
        }
    }

    private checkAdminPermission(guild: Guild, userId?: string): boolean {
        if (!userId) return false;
        
        try {
            const member = guild.members.cache.get(userId);
            return member?.permissions.has('ADMINISTRATOR') ?? false;
        } catch {
            return false;
        }
    }

    private async cloneRoles(
        source: Guild,
        target: Guild,
        progress: CloneProgress,
        onProgress?: ProgressCallback
    ): Promise<void> {
        const roles = this.extractRoles(source);
        
        await onProgress?.(`📋 Clonando ${roles.length} cargos...`);

        for (const roleData of roles) {
            if (this.shouldStop) break;

            try {
                await target.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: roleData.permissions,
                    mentionable: roleData.mentionable
                });
                
                progress.rolesCreated++;
                await this.delay(CLONE_DELAY);
            } catch (error) {
                progress.errors++;
                this.logger.error(`Erro ao criar cargo ${roleData.name}: ${error}`);
            }
        }
    }

    private async cloneCategories(
        source: Guild,
        target: Guild,
        progress: CloneProgress,
        onProgress?: ProgressCallback
    ): Promise<void> {
        const categories = this.extractCategories(source);
        
        await onProgress?.(`📁 Clonando ${categories.length} categorias...`);

        for (const category of categories) {
            if (this.shouldStop) break;

            try {
                const newCategory = await target.channels.create(category.name, {
                    type: 'GUILD_CATEGORY',
                    position: category.position
                });

                this.categoryMap.set(category.id, newCategory.id);
                progress.categoriesCreated++;
                await this.delay(CLONE_DELAY);
            } catch (error) {
                progress.errors++;
                this.logger.error(`Erro ao criar categoria ${category.name}: ${error}`);
            }
        }
    }

    private async cloneChannels(
        source: Guild,
        target: Guild,
        progress: CloneProgress,
        onProgress?: ProgressCallback
    ): Promise<void> {
        const channels = this.extractChannels(source);
        
        await onProgress?.(`💬 Clonando ${channels.length} canais...`);

        for (const channelData of channels) {
            if (this.shouldStop) break;

            try {
                const parentId = this.resolveParentId(channelData);
                const channelType = this.mapChannelType(channelData.type);
                
                const options: any = {
                    type: channelType,
                    parent: parentId
                };

                if (channelData.topic) options.topic = channelData.topic;
                if (channelData.nsfw) options.nsfw = channelData.nsfw;
                if (channelData.rateLimitPerUser) options.rateLimitPerUser = channelData.rateLimitPerUser;
                if (channelData.bitrate) options.bitrate = channelData.bitrate;
                if (channelData.userLimit) options.userLimit = channelData.userLimit;

                await target.channels.create(channelData.name, options);

                progress.channelsCreated++;
                await this.delay(CLONE_DELAY);
            } catch (error) {
                progress.errors++;
                this.logger.error(`Erro ao criar canal ${channelData.name}: ${error}`);
            }
        }
    }

    private async cloneEmojis(
        source: Guild,
        target: Guild,
        progress: CloneProgress,
        onProgress?: ProgressCallback
    ): Promise<void> {
        const emojis = source.emojis.cache;
        
        if (emojis.size === 0) return;
        
        await onProgress?.(`😀 Clonando ${emojis.size} emojis...`);

        for (const [, emoji] of emojis) {
            if (this.shouldStop) break;

            try {
                const url = emoji.url;
                if (!url) continue;

                await target.emojis.create(url, emoji.name ?? 'emoji');
                progress.emojisCreated++;
                await this.delay(EMOJI_DELAY);
            } catch (error) {
                progress.errors++;
                this.logger.error(`Erro ao criar emoji ${emoji.name}: ${error}`);
            }
        }
    }

    private extractRoles(guild: Guild): RoleData[] {
        return guild.roles.cache
            .filter(role => role.name !== '@everyone' && !role.managed)
            .sort((a, b) => b.position - a.position)
            .map(role => ({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions,
                mentionable: role.mentionable
            }));
    }

    private extractCategories(guild: Guild): ChannelData[] {
        return guild.channels.cache
            .filter((ch): ch is CategoryChannel => ch.type === 'GUILD_CATEGORY')
            .sort((a, b) => a.position - b.position)
            .map(ch => this.channelToData(ch));
    }

    private extractChannels(guild: Guild): ChannelData[] {
        const channels: ChannelData[] = [];
        
        guild.channels.cache.forEach(ch => {
            const isCategory = ch.type === 'GUILD_CATEGORY';
            const isThread = ch.isThread();
            const isSkipped = SKIP_CHANNEL_TYPES.has(ch.type);
            const hasPosition = 'position' in ch;
            
            if (!isCategory && !isThread && !isSkipped && hasPosition) {
                channels.push(this.channelToData(ch as GuildChannel));
            }
        });
        
        return channels.sort((a, b) => a.position - b.position);
    }

    private channelToData(channel: GuildChannel): ChannelData {
        const base: ChannelData = {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            position: 'position' in channel ? (channel as any).position : 0,
            parentId: channel.parentId ?? null
        };

        if (channel instanceof TextChannel) {
            return { 
                ...base, 
                topic: channel.topic ?? undefined, 
                nsfw: channel.nsfw,
                rateLimitPerUser: channel.rateLimitPerUser
            };
        }

        if (channel instanceof VoiceChannel) {
            return { 
                ...base, 
                bitrate: channel.bitrate, 
                userLimit: channel.userLimit 
            };
        }

        return base;
    }

    private resolveParentId(channelData: ChannelData): string | undefined {
        if (!channelData.parentId) return undefined;
        return this.categoryMap.get(channelData.parentId);
    }

    private mapChannelType(type: string): string {
        if (SUPPORTED_CHANNEL_TYPES.has(type)) {
            return type;
        }
        return 'GUILD_TEXT';
    }

    private buildResult(
        progress: CloneProgress, 
        success: boolean, 
        isAdmin: boolean,
        errorType?: CloneResult['errorType']
    ): CloneResult {
        return {
            success,
            isAdmin,
            categoriesCreated: progress.categoriesCreated,
            channelsCreated: progress.channelsCreated,
            rolesCreated: progress.rolesCreated,
            emojisCreated: progress.emojisCreated,
            errors: progress.errors,
            stopped: this.shouldStop,
            errorType
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let instance: GuildCloneService | null = null;

export const getGuildCloneService = (): GuildCloneService => {
    if (!instance) {
        instance = new GuildCloneService();
    }
    return instance;
};
