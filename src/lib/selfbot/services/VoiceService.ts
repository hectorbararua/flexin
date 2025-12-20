import { Client, VoiceChannel, StageChannel } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { IVoiceService } from '../types';

interface VoiceState {
    targetChannelId: string | null;
    targetGuildId: string | null;
    isLeavingVoluntarily: boolean;
    isReconnecting: boolean;
}

interface JoinOptions {
    selfMute?: boolean;
    selfDeaf?: boolean;
}

type VoiceChannelType = VoiceChannel | StageChannel;

const VOICE_CHANNEL_TYPES = {
    GUILD_VOICE: 'GUILD_VOICE',
    GUILD_VOICE_ENUM: 2,
    STAGE_VOICE_ENUM: 13
};

const CONNECTION_DELAY_MS = 2000;
const VOLUNTARY_FLAG_RESET_MS = 2000;

export class VoiceService implements IVoiceService {
    private readonly logger = Logger.child('[Voice]');
    
    private state: VoiceState = {
        targetChannelId: null,
        targetGuildId: null,
        isLeavingVoluntarily: false,
        isReconnecting: false
    };

    async join(client: Client, channelId: string, options: JoinOptions = {}): Promise<boolean> {
        try {
            if (this.isAlreadyInChannel(client, channelId)) {
                this.logger.info('Já está no canal de voz alvo');
                return true;
            }

            const channel = await this.fetchVoiceChannel(client, channelId);
            if (!channel) return false;

            this.setTarget(channelId, channel.guild.id);
            await this.connectToChannel(client, channel, options);
            
            return true;
        } catch (error) {
            this.logError('Erro ao entrar no canal de voz', error);
            return false;
        }
    }

    async leave(client: Client, _guildId: string): Promise<boolean> {
        try {
            this.state.isLeavingVoluntarily = true;
            this.clearTarget();

            if (!client.voice.connection) {
                this.logger.warning('Você não está em um canal de voz');
                this.resetVoluntaryFlag();
                return false;
            }

            client.voice.connection.disconnect();
            this.logger.info('👋 Saiu do canal de voz (reconexão desativada)');
            
            setTimeout(() => this.resetVoluntaryFlag(), VOLUNTARY_FLAG_RESET_MS);
            return true;
        } catch (error) {
            this.logError('Erro ao sair do canal', error);
            this.resetVoluntaryFlag();
            return false;
        }
    }

    async reconnect(client: Client): Promise<boolean> {
        if (this.state.isLeavingVoluntarily) {
            this.logger.info('Reconexão cancelada (saída voluntária)');
            return false;
        }

        if (!this.hasTarget()) {
            this.logger.info('Reconexão cancelada (sem canal alvo)');
            return false;
        }

        if (this.isAlreadyInChannel(client, this.state.targetChannelId!)) {
            this.logger.info('Já está no canal de voz alvo, reconexão não necessária');
            return true;
        }

        if (this.state.isReconnecting) {
            this.logger.info('Reconexão já em andamento...');
            return false;
        }

        try {
            this.state.isReconnecting = true;
            this.logger.warning('🔄 Tentando reconectar ao canal de voz...');
            return await this.join(client, this.state.targetChannelId!);
        } finally {
            this.state.isReconnecting = false;
        }
    }

    shouldReconnect(): boolean {
        return !this.state.isLeavingVoluntarily && this.hasTarget();
    }

    getTargetChannelId(): string | null {
        return this.state.targetChannelId;
    }

    getTargetGuildId(): string | null {
        return this.state.targetGuildId;
    }

    clearTarget(): void {
        this.state.targetChannelId = null;
        this.state.targetGuildId = null;
    }

    hasTarget(): boolean {
        return this.state.targetChannelId !== null;
    }

    private isAlreadyInChannel(client: Client, channelId: string): boolean {
        return client.voice.connection?.channel?.id === channelId;
    }

    private async fetchVoiceChannel(client: Client, channelId: string): Promise<VoiceChannelType | null> {
        this.logger.info(`Buscando canal: ${channelId}`);
        
        const channel = await client.channels.fetch(channelId);

        if (!channel) {
            this.logger.error('Canal não encontrado!');
            return null;
        }

        if (!this.isVoiceChannel(channel)) {
            this.logger.error('O canal informado não é um canal de voz!');
            return null;
        }

        return channel as VoiceChannelType;
    }

    private async connectToChannel(client: Client, channel: VoiceChannelType, options: JoinOptions): Promise<void> {
        const selfMute = options.selfMute ?? false;
        const selfDeaf = options.selfDeaf ?? false;
        const muteStatus = selfMute ? '🔇 Mutado' : '🔊 Desmutado';

        this.logger.info(`Entrando no canal: ${channel.name} (${muteStatus})`);

        client.voice.joinChannel(channel, { selfMute, selfDeaf, selfVideo: false })
            .then(connection => {
                connection.on('error', (error: Error) => {
                    this.logger.error(`Erro na conexão de voz: ${error.message}`);
                });
            })
            .catch((error) => {
                this.logger.warning(`Aviso na conexão: ${error.message || 'timeout'}`);
            });

        await this.delay(CONNECTION_DELAY_MS);
        this.logger.success(`Entrei no canal de voz: ${this.logger.highlight(channel.name)} (${muteStatus})`);
    }

    private setTarget(channelId: string, guildId: string): void {
        this.state.targetChannelId = channelId;
        this.state.targetGuildId = guildId;
    }

    private isVoiceChannel(channel: unknown): boolean {
        if (!channel || typeof channel !== 'object') return false;
        
        const ch = channel as { type?: string | number; isVoice?: () => boolean };
        
        return ch.type === VOICE_CHANNEL_TYPES.GUILD_VOICE ||
               ch.type === VOICE_CHANNEL_TYPES.GUILD_VOICE_ENUM ||
               ch.type === VOICE_CHANNEL_TYPES.STAGE_VOICE_ENUM ||
               (typeof ch.isVoice === 'function' && ch.isVoice());
    }

    private resetVoluntaryFlag(): void {
        this.state.isLeavingVoluntarily = false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private logError(message: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`${message}: ${errorMessage}`);
    }
}

export const createVoiceService = (): VoiceService => new VoiceService();
