"use strict";
/**
 * Voice Service - Handles voice channel operations for selfbot clients
 * Single Responsibility: Only manages voice channel connections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoiceService = exports.VoiceService = void 0;
const Logger_1 = require("../utils/Logger");
class VoiceService {
    state = {
        targetChannelId: null,
        targetGuildId: null,
        isLeavingVoluntarily: false
    };
    logger = Logger_1.Logger.child('[Voice]');
    /**
     * Joins a voice channel
     * @param client - Selfbot client instance
     * @param channelId - ID of the voice channel to join
     * @param options - Optional settings for mute/deaf
     */
    async join(client, channelId, options = {}) {
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
            const voiceChannel = channel;
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
        }
        catch (error) {
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
    async leave(client, guildId) {
        try {
            this.state.isLeavingVoluntarily = true;
            this.clearTarget();
            const guild = await client.guilds.fetch(guildId);
            const member = await guild?.members.fetch(client.user.id);
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
        }
        catch (error) {
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
    async reconnect(client) {
        if (this.state.isLeavingVoluntarily) {
            this.logger.info('Reconexão cancelada (saída voluntária)');
            return false;
        }
        if (!this.hasTarget()) {
            this.logger.info('Reconexão cancelada (sem canal alvo)');
            return false;
        }
        this.logger.warning('🔄 Tentando reconectar ao canal de voz...');
        return this.join(client, this.state.targetChannelId);
    }
    /**
     * Checks if reconnection should be attempted
     */
    shouldReconnect() {
        return !this.state.isLeavingVoluntarily && this.hasTarget();
    }
    /**
     * Gets the current target channel ID
     */
    getTargetChannelId() {
        return this.state.targetChannelId;
    }
    /**
     * Gets the current target guild ID
     */
    getTargetGuildId() {
        return this.state.targetGuildId;
    }
    /**
     * Clears the target channel
     */
    clearTarget() {
        this.state.targetChannelId = null;
        this.state.targetGuildId = null;
    }
    /**
     * Checks if there's a target channel set
     */
    hasTarget() {
        return this.state.targetChannelId !== null;
    }
    /**
     * Validates if a channel is a voice channel
     */
    isVoiceChannel(channel) {
        if (!channel || typeof channel !== 'object')
            return false;
        const ch = channel;
        // Check various voice channel type indicators
        const isVoice = ch.type === 'GUILD_VOICE' ||
            ch.type === 2 || // GUILD_VOICE enum value
            ch.type === 13 || // GUILD_STAGE_VOICE enum value
            (typeof ch.isVoice === 'function' && ch.isVoice());
        return isVoice;
    }
    /**
     * Resets the voluntary leaving flag
     */
    resetVoluntaryFlag() {
        this.state.isLeavingVoluntarily = false;
    }
}
exports.VoiceService = VoiceService;
// Factory function for creating voice service instances
const createVoiceService = () => new VoiceService();
exports.createVoiceService = createVoiceService;
