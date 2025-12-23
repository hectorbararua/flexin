import { Client, VoiceChannel, StageChannel, DMChannel } from 'discord.js-selfbot-v13';
import { Logger } from '../utils/Logger';
import { IVoiceService } from '../types';

interface VoiceState {
    targetChannelId: string | null;
    targetGuildId: string | null;
    isLeavingVoluntarily: boolean;
    isReconnecting: boolean;
    isPrivateCall: boolean;
    isConnecting: boolean;
    lastJoinOptions: JoinOptions;
    userId: string | null;
}

type ConnectionCallback = (userId: string, connected: boolean) => void;

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
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

export class VoiceService implements IVoiceService {
    private readonly logger = Logger.child('[Voice]');
    private connectionCallback: ConnectionCallback | null = null;
    
    private state: VoiceState = {
        targetChannelId: null,
        targetGuildId: null,
        isLeavingVoluntarily: false,
        isReconnecting: false,
        isPrivateCall: false,
        isConnecting: false,
        lastJoinOptions: {},
        userId: null
    };

    onConnectionChange(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
    }

    private notifyConnection(connected: boolean): void {
        if (this.connectionCallback && this.state.userId) {
            this.connectionCallback(this.state.userId, connected);
        }
    }

    async join(client: Client, channelOrUserId: string, options: JoinOptions = {}, userId?: string): Promise<boolean> {
        try {
            this.state.lastJoinOptions = { ...options };
            if (userId) {
                this.state.userId = userId;
            }

            if (this.isAlreadyInChannel(client, channelOrUserId)) {
                this.logger.info('Já está no canal de voz alvo');
                return true;
            }

            const channel = await this.fetchVoiceChannel(client, channelOrUserId);
            
            if (channel) {
                this.setTarget(channelOrUserId, (channel as VoiceChannel).guild?.id || 'private');
                this.state.isPrivateCall = false;
                const success = await this.connectToChannel(client, channel as VoiceChannel, options);
                
                if (!success) {
                    this.clearTarget();
                }
                
                return success;
            }

            return await this.joinPrivateCall(client, channelOrUserId, options);
        } catch (error) {
            this.logError('Erro ao entrar no canal de voz', error);
            this.clearTarget();
            return false;
        }
    }

    private async joinPrivateCall(client: Client, userId: string, options: JoinOptions): Promise<boolean> {
        try {
            this.logger.info(`Tentando call privada com usuário: ${userId}`);
            
            const user = await client.users.fetch(userId);
            if (!user) {
                this.logger.error('Usuário não encontrado!');
                return false;
            }

            this.logger.info(`Usuário encontrado: ${user.tag}`);
            
            const dmChannel = await user.createDM();
            if (!dmChannel) {
                this.logger.error('Não foi possível criar DM com o usuário!');
                return false;
            }

            this.logger.info('Iniciando call privada...');
            
            const selfMute = options.selfMute ?? false;
            const selfDeaf = options.selfDeaf ?? false;
            
            const connection = await client.voice.joinChannel(dmChannel as any, { 
                selfMute, 
                selfDeaf, 
                selfVideo: false 
            });
            
            connection.on('error', (error: Error) => {
                this.logger.error(`Erro na call privada: ${error.message}`);
            });
            
            this.state.targetChannelId = dmChannel.id;
            this.state.targetGuildId = 'private';
            this.state.isPrivateCall = true;
            
            await this.delay(CONNECTION_DELAY_MS);
            
            if (client.voice.connection) {
                this.logger.success(`Call privada iniciada com: ${this.logger.highlight(user.tag)}`);
                this.notifyConnection(true);
                return true;
            }
            
            this.notifyConnection(false);
            throw new Error('Conexão não estabelecida');
        } catch (error: any) {
            this.logger.error(`Erro na call privada: ${error.message}`);
            this.clearTarget();
            return false;
        }
    }

    async leave(client: Client, _guildId: string): Promise<boolean> {
        try {
            this.state.isLeavingVoluntarily = true;
            this.notifyConnection(false);
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
            const muteStatus = this.state.lastJoinOptions.selfMute ? '🔇 Mutado' : '🔊 Desmutado';
            this.logger.warning(`🔄 Tentando reconectar ao canal de voz... (${muteStatus})`);
            return await this.join(client, this.state.targetChannelId!, this.state.lastJoinOptions);
        } finally {
            this.state.isReconnecting = false;
        }
    }

    shouldReconnect(): boolean {
        return !this.state.isLeavingVoluntarily && !this.state.isConnecting && this.hasTarget();
    }

    isConnecting(): boolean {
        return this.state.isConnecting;
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
        this.state.isPrivateCall = false;
        this.state.isConnecting = false;
        this.state.lastJoinOptions = {};
        this.state.userId = null;
    }

    hasTarget(): boolean {
        return this.state.targetChannelId !== null;
    }

    private isAlreadyInChannel(client: Client, channelId: string): boolean {
        return client.voice.connection?.channel?.id === channelId;
    }

    private async fetchVoiceChannel(client: Client, channelId: string): Promise<VoiceChannel | StageChannel | null> {
        this.logger.info(`Buscando canal: ${channelId}`);
        
        try {
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
                return null;
            }

            if (!this.isVoiceChannel(channel)) {
                return null;
            }

            return channel as VoiceChannel | StageChannel;
        } catch {
            return null;
        }
    }

    private async connectToChannel(
        client: Client, 
        channel: VoiceChannelType, 
        options: JoinOptions
    ): Promise<boolean> {
        const selfMute = options.selfMute ?? false;
        const selfDeaf = options.selfDeaf ?? false;
        const muteStatus = selfMute ? '🔇 Mutado' : '🔊 Desmutado';

        this.logger.info(`Entrando no canal: ${channel.name} (${muteStatus})`);

        this.state.isConnecting = true;

        this.connectInBackground(client, channel, options, muteStatus);
        
        return true;
    }

    private connectInBackground(
        client: Client,
        channel: VoiceChannelType,
        options: JoinOptions,
        muteStatus: string,
        attempt: number = 1
    ): void {
        if (this.state.isLeavingVoluntarily || !this.hasTarget()) {
            this.state.isConnecting = false;
            return;
        }

        const selfMute = options.selfMute ?? false;
        const selfDeaf = options.selfDeaf ?? false;

        client.voice.joinChannel(channel, { selfMute, selfDeaf, selfVideo: false })
            .then(connection => {
                connection.on('error', () => {});

                setTimeout(() => {
                    if (client.voice.connection?.channel?.id === channel.id) {
                        this.state.isConnecting = false;
                        this.logger.success(`Conectado: ${this.logger.highlight(channel.name)} (${muteStatus})`);
                        this.notifyConnection(true);
                    } else {
                        this.retryIfNeeded(client, channel, options, muteStatus, attempt);
                    }
                }, CONNECTION_DELAY_MS);
            })
            .catch(() => {
                this.retryIfNeeded(client, channel, options, muteStatus, attempt);
            });
    }

    private retryIfNeeded(
        client: Client,
        channel: VoiceChannelType,
        options: JoinOptions,
        muteStatus: string,
        attempt: number
    ): void {
        if (client.voice.connection?.channel?.id === channel.id) {
            this.state.isConnecting = false;
            return;
        }

        if (this.state.isLeavingVoluntarily || !this.hasTarget()) {
            this.state.isConnecting = false;
            return;
        }

        if (attempt < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => {
                this.connectInBackground(client, channel, options, muteStatus, attempt + 1);
            }, RETRY_DELAY_MS);
        } else {
            this.state.isConnecting = false;
            this.logger.error(`Não foi possível conectar após ${MAX_RETRY_ATTEMPTS} tentativas`);
            this.notifyConnection(false);
            this.clearTarget();
        }
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
