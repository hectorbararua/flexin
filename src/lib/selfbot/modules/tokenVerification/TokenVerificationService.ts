import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { Client as SelfbotClient } from 'discord.js-selfbot-v13';
import { Logger } from '../../utils/Logger';
import { getTokenService } from '../../services/TokenService';
import { VERIFICATION_CONFIG, VERIFICATION_MESSAGES } from './constants';

interface VerificationResult {
    userId: string;
    username: string;
    isValid: boolean;
    tag?: string;
}

export class TokenVerificationService {
    private readonly logger = Logger.child('[TokenVerification]');
    private botClient: Client | null = null;
    private scheduledTimeout: NodeJS.Timeout | null = null;
    private isRunning = false;

    setBotClient(client: Client): void {
        this.botClient = client;
        this.scheduleNextVerification();
        this.logger.success('Token verification service iniciado');
    }

    async runVerification(): Promise<void> {
        if (this.isRunning) {
            this.logger.warning('Verificação já em andamento...');
            return;
        }

        if (!this.botClient) {
            this.logger.error('Bot client não configurado');
            return;
        }

        this.isRunning = true;
        this.logger.info('Iniciando verificação de tokens...');

        try {
            const channel = await this.fetchLogChannel();
            if (!channel) return;

            const tokenService = getTokenService();
            const allTokens = tokenService.getAllTokens();

            if (Object.keys(allTokens).length === 0) {
                await channel.send(VERIFICATION_MESSAGES.NO_TOKENS);
                this.logger.info('Nenhuma token registrada');
                return;
            }

            const results = await this.verifyAllTokens(allTokens);
            await this.sendResults(channel, results);
            await this.updateRoles(results);

            this.logger.success('Verificação concluída');
        } catch (error) {
            this.logger.error(`Erro na verificação: ${error}`);
        } finally {
            this.isRunning = false;
        }
    }

    stop(): void {
        if (this.scheduledTimeout) {
            clearTimeout(this.scheduledTimeout);
            this.scheduledTimeout = null;
            this.logger.info('Verificação agendada cancelada');
        }
    }

    private scheduleNextVerification(): void {
        const now = new Date();
        const targetTime = new Date();
        
        targetTime.setHours(VERIFICATION_CONFIG.verificationHour);
        targetTime.setMinutes(VERIFICATION_CONFIG.verificationMinute);
        targetTime.setSeconds(0);
        targetTime.setMilliseconds(0);

        if (now >= targetTime) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const msUntilVerification = targetTime.getTime() - now.getTime();
        const hoursUntil = Math.floor(msUntilVerification / (1000 * 60 * 60));
        const minutesUntil = Math.floor((msUntilVerification % (1000 * 60 * 60)) / (1000 * 60));

        this.logger.info(`Próxima verificação em ${hoursUntil}h ${minutesUntil}min (${targetTime.toLocaleString('pt-BR')})`);

        this.scheduledTimeout = setTimeout(async () => {
            await this.runVerification();
            this.scheduleNextVerification();
        }, msUntilVerification);
    }

    private async fetchLogChannel(): Promise<TextChannel | null> {
        try {
            const channel = await this.botClient!.channels.fetch(VERIFICATION_CONFIG.logChannelId);
            if (!channel?.isTextBased()) {
                this.logger.error('Canal de log inválido');
                return null;
            }
            return channel as TextChannel;
        } catch (error) {
            this.logger.error(`Canal de log não encontrado: ${error}`);
            return null;
        }
    }

    private async verifyAllTokens(allTokens: Record<string, any>): Promise<VerificationResult[]> {
        const results: VerificationResult[] = [];

        for (const [odiscordId, data] of Object.entries(allTokens)) {
            const result = await this.verifyToken(odiscordId, data);
            results.push(result);
            
            await this.delay(2000);
        }

        return results;
    }

    private async verifyToken(odiscordId: string, data: any): Promise<VerificationResult> {
        const result: VerificationResult = {
            userId: odiscordId,
            username: data.odiscordUsername || 'Desconhecido',
            isValid: false
        };

        if (!data.token) {
            return result;
        }

        try {
            const testClient = new SelfbotClient();
            
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    testClient.destroy();
                    reject(new Error('Timeout'));
                }, 15000);

                testClient.once('ready', () => {
                    clearTimeout(timeout);
                    result.isValid = true;
                    result.tag = testClient.user?.tag || 'Desconhecido';
                    testClient.destroy();
                    resolve();
                });

                testClient.login(data.token).catch(() => {
                    clearTimeout(timeout);
                    testClient.destroy();
                    reject(new Error('Login failed'));
                });
            });

            this.logger.info(`✅ ${result.username} - Token válida`);
        } catch {
            this.logger.info(`❌ ${result.username} - Token inválida`);
        }

        return result;
    }

    private async sendResults(channel: TextChannel, results: VerificationResult[]): Promise<void> {
        const validCount = results.filter(r => r.isValid).length;
        const invalidCount = results.filter(r => !r.isValid).length;

        const lines: string[] = [];
        
        results.filter(r => r.isValid).forEach(r => {
            lines.push(VERIFICATION_MESSAGES.VALID(r.tag!, r.userId));
        });

        results.filter(r => !r.isValid).forEach(r => {
            lines.push(VERIFICATION_MESSAGES.INVALID(r.userId));
        });

        const embed = new EmbedBuilder()
            .setTitle(VERIFICATION_MESSAGES.TITLE)
            .setDescription(
                lines.join('\n') + 
                VERIFICATION_MESSAGES.SUMMARY(results.length, validCount, invalidCount)
            )
            .setColor(invalidCount > 0 ? '#FF6B6B' : '#57F287')
            .setTimestamp()
            .setFooter({ text: `Verificação às ${VERIFICATION_CONFIG.verificationHour}:${String(VERIFICATION_CONFIG.verificationMinute).padStart(2, '0')}` });

        await channel.send({ embeds: [embed] });
    }

    private async updateRoles(results: VerificationResult[]): Promise<void> {
        if (!this.botClient) return;

        try {
            const guild = await this.botClient.guilds.fetch(VERIFICATION_CONFIG.guildId);
            if (!guild) return;

            for (const result of results) {
                try {
                    const member = await guild.members.fetch(result.userId).catch(() => null);
                    if (!member) continue;

                    if (result.isValid) {
                        if (!member.roles.cache.has(VERIFICATION_CONFIG.verifiedRoleId)) {
                            await member.roles.add(VERIFICATION_CONFIG.verifiedRoleId).catch(() => {});
                        }
                        if (VERIFICATION_CONFIG.unverifiedRoleId && member.roles.cache.has(VERIFICATION_CONFIG.unverifiedRoleId)) {
                            await member.roles.remove(VERIFICATION_CONFIG.unverifiedRoleId).catch(() => {});
                        }
                    } else {
                        if (member.roles.cache.has(VERIFICATION_CONFIG.verifiedRoleId)) {
                            await member.roles.remove(VERIFICATION_CONFIG.verifiedRoleId).catch(() => {});
                            this.logger.info(`Cargo removido de ${result.username}`);
                        }
                        if (VERIFICATION_CONFIG.unverifiedRoleId && !member.roles.cache.has(VERIFICATION_CONFIG.unverifiedRoleId)) {
                            await member.roles.add(VERIFICATION_CONFIG.unverifiedRoleId).catch(() => {});
                        }
                    }

                    await this.delay(500);
                } catch {
                }
            }
        } catch (error) {
            this.logger.error(`Erro ao atualizar cargos: ${error}`);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let instance: TokenVerificationService | null = null;

export const getTokenVerificationService = (): TokenVerificationService => {
    if (!instance) {
        instance = new TokenVerificationService();
    }
    return instance;
};
