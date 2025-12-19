/**
 * Voice Service - Handles voice channel operations for selfbot clients
 * Single Responsibility: Only manages voice channel connections
 */

import { Client, VoiceChannel, StageChannel } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { IVoiceService } from '../types';

interface VoiceState {
    targetChannelId: string | null;
    targetGuildId: string | null;
    isLeavingVoluntarily: boolean;
}

type VoiceChannelType = VoiceChannel | StageChannel;

export class VoiceService implements IVoiceService {
    private state: VoiceState = {
        targetChannelId: null,
        targetGuildId: null,
        isLeavingVoluntarily: false
    };

    private readonly logger = Logger.child('[Voice]');

    /**
     * Joins a voice channel
     * @param client - Selfbot client instance
     * @param channelId - ID of the voice channel to join
     * @param options - Optional settings for mute/deaf
     */
    async join(
        client: Client, 
        channelId: string, 
        options: { selfMute?: boolean; selfDeaf?: boolean } = {}
    ): Promise<boolean> {
        try {
            this.logger.info(`Buscando canal: ${channelId}`);
            
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
                this.logger.error('Canal não encontrado!');
                return false;
            }

            if (!this.isVoiceChannel(channel)) {
                this.logger.error('O canal informado não é um canal de voz!');
                return false;
            }

            const voiceChannel = channel as VoiceChannelType;
            
            this.state.targetChannelId = channelId;
            this.state.targetGuildId = voiceChannel.guild.id;

            const selfMute = options.selfMute ?? false;
            const selfDeaf = options.selfDeaf ?? false;
            
            const muteStatus = selfMute ? '🔇 Mutado' : '🔊 Desmutado';
            this.logger.info(`Entrando no canal: ${voiceChannel.name} (${muteStatus})`);
            
            // Inicia a conexão sem aguardar (fire-and-forget)
            client.voice.joinChannel(voiceChannel, {
                selfMute,
                selfDeaf,
                selfVideo: false
            }).catch(() => {
                // Ignora erro de timeout - a conexão geralmente funciona mesmo assim
            });
            
            // Aguarda um pouco para a conexão ser estabelecida
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.logger.success(`Entrei no canal de voz: ${this.logger.highlight(voiceChannel.name)} (${muteStatus})`);
            return true;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro ao entrar no canal de voz: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Leaves the current voice channel
     * @param client - Selfbot client instance
     * @param guildId - ID of the guild to leave voice from
     */
    async leave(client: Client, guildId: string): Promise<boolean> {
        try {
            this.state.isLeavingVoluntarily = true;
            this.clearTarget();

            const guild = await client.guilds.fetch(guildId);
            const member = await guild?.members.fetch(client.user!.id);

            if (!member?.voice.channel) {
                this.logger.warning('Você não está em um canal de voz');
                this.resetVoluntaryFlag();
                return false;
            }

            await member.voice.disconnect();
            this.logger.info('👋 Saiu do canal de voz (reconexão desativada)');
            
            // Reset flag after 2 seconds to allow event handlers to check it
            setTimeout(() => this.resetVoluntaryFlag(), 2000);
            
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro ao sair do canal: ${errorMessage}`);
            this.resetVoluntaryFlag();
            return false;
        }
    }

    /**
     * Attempts to reconnect to the last voice channel
     * @param client - Selfbot client instance
     */
    async reconnect(client: Client): Promise<boolean> {
        if (this.state.isLeavingVoluntarily) {
            this.logger.info('Reconexão cancelada (saída voluntária)');
            return false;
        }

        if (!this.hasTarget()) {
            this.logger.info('Reconexão cancelada (sem canal alvo)');
            return false;
        }

        this.logger.warning('🔄 Tentando reconectar ao canal de voz...');
        return this.join(client, this.state.targetChannelId!);
    }

    /**
     * Checks if reconnection should be attempted
     */
    shouldReconnect(): boolean {
        return !this.state.isLeavingVoluntarily && this.hasTarget();
    }

    /**
     * Gets the current target channel ID
     */
    getTargetChannelId(): string | null {
        return this.state.targetChannelId;
    }

    /**
     * Gets the current target guild ID
     */
    getTargetGuildId(): string | null {
        return this.state.targetGuildId;
    }

    /**
     * Clears the target channel
     */
    clearTarget(): void {
        this.state.targetChannelId = null;
        this.state.targetGuildId = null;
    }

    /**
     * Checks if there's a target channel set
     */
    hasTarget(): boolean {
        return this.state.targetChannelId !== null;
    }

    /**
     * Validates if a channel is a voice channel
     */
    private isVoiceChannel(channel: unknown): boolean {
        if (!channel || typeof channel !== 'object') return false;
        
        const ch = channel as { type?: string | number; isVoice?: () => boolean };
        
        // Check various voice channel type indicators
        const isVoice = ch.type === 'GUILD_VOICE' || 
                        ch.type === 2 ||  // GUILD_VOICE enum value
                        ch.type === 13 || // GUILD_STAGE_VOICE enum value
                        (typeof ch.isVoice === 'function' && ch.isVoice());
        
        return isVoice;
    }

    /**
     * Resets the voluntary leaving flag
     */
    private resetVoluntaryFlag(): void {
        this.state.isLeavingVoluntarily = false;
    }
}

// Factory function for creating voice service instances
export const createVoiceService = (): VoiceService => new VoiceService();

