import { Client, VoiceChannel, GuildMember, Guild } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';

export interface ColeiraConfig {
    readonly ownerUserId: string;
    readonly targetUserId: string;
}

export interface ColeiraStatus {
    readonly isActive: boolean;
    readonly targetUserId?: string;
}

const PULL_INTERVAL = 5000;

export class ColeiraService {
    private readonly logger = Logger.child('[Coleira]');
    private readonly activeColeiras = new Map<string, NodeJS.Timeout>();
    private readonly configs = new Map<string, ColeiraConfig>();

    isActive(userId: string): boolean {
        return this.activeColeiras.has(userId);
    }

    getStatus(userId: string): ColeiraStatus {
        const config = this.configs.get(userId);
        return {
            isActive: this.activeColeiras.has(userId),
            targetUserId: config?.targetUserId
        };
    }

    async start(
        client: Client, 
        config: ColeiraConfig
    ): Promise<{ success: boolean; message?: string }> {
        const { ownerUserId } = config;

        if (this.isActive(ownerUserId)) {
            this.stop(ownerUserId);
            return { success: true, message: 'stopped' };
        }

        this.configs.set(ownerUserId, config);

        const result = await this.pullUser(client, config);
        
        if (!result.success && result.reason === 'owner_not_in_call') {
            this.configs.delete(ownerUserId);
            return { success: false, message: 'owner_not_in_call' };
        }

        const interval = setInterval(async () => {
            await this.pullUser(client, config);
        }, PULL_INTERVAL);

        this.activeColeiras.set(ownerUserId, interval);
        this.logger.success(`Coleira ativada: puxando ${config.targetUserId} para onde ${ownerUserId} estiver`);
        
        return { success: true };
    }

    stop(userId: string): boolean {
        const interval = this.activeColeiras.get(userId);
        
        if (!interval) {
            return false;
        }

        clearInterval(interval);
        this.activeColeiras.delete(userId);
        this.configs.delete(userId);
        
        this.logger.info('Coleira desativada');
        return true;
    }

    stopAll(): void {
        for (const [userId] of this.activeColeiras) {
            this.stop(userId);
        }
    }

    private async pullUser(
        client: Client, 
        config: ColeiraConfig
    ): Promise<{ success: boolean; reason?: string }> {
        try {
            const ownerLocation = await this.findUserVoiceChannel(client, config.ownerUserId);
            
            if (!ownerLocation) {
                this.logger.info('Dono não está em nenhuma call, aguardando...');
                return { success: true, reason: 'owner_not_in_call' };
            }

            const { guild, channel } = ownerLocation;
            this.logger.info(`Dono está em: ${channel.name} (${guild.name})`);

            const targetMember = await this.fetchMember(guild, config.targetUserId);
            if (!targetMember) {
                this.logger.error(`Alvo não encontrado no servidor: ${config.targetUserId}`);
                return { success: true };
            }

            if (!targetMember.voice.channelId) {
                this.logger.info(`Alvo ${targetMember.user.tag} não está em call, aguardando...`);
                return { success: true };
            }

            if (targetMember.voice.channelId === channel.id) {
                this.logger.info(`Alvo já está no mesmo canal que o dono`);
                return { success: true };
            }

            await targetMember.voice.setChannel(channel);
            this.logger.success(`Puxou ${targetMember.user.tag} para ${channel.name}`);
            
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Erro ao puxar: ${error.message} (code: ${error.code})`);
            return { success: true };
        }
    }

    private async findUserVoiceChannel(
        client: Client, 
        userId: string
    ): Promise<{ guild: Guild; channel: VoiceChannel; member: GuildMember } | null> {
        for (const [, guild] of client.guilds.cache) {
            try {
                const member = await this.fetchMember(guild, userId);
                
                if (member?.voice.channelId) {
                    const channel = guild.channels.cache.get(member.voice.channelId) as VoiceChannel;
                    if (channel) {
                        return { guild, channel, member };
                    }
                }
            } catch {
                continue;
            }
        }
        return null;
    }

    private async fetchMember(guild: Guild, userId: string): Promise<GuildMember | null> {
        try {
            let member = guild.members.cache.get(userId);
            if (!member) {
                member = await guild.members.fetch(userId);
            }
            return member;
        } catch {
            return null;
        }
    }
}

let instance: ColeiraService | null = null;

export const getColeiraService = (): ColeiraService => {
    if (!instance) {
        instance = new ColeiraService();
    }
    return instance;
};
