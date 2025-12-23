import { Client } from 'discord.js';
import { Logger } from '../utils/Logger';
import { CallRoleConfig } from '../types';

export class CallRoleService {
    private readonly logger = Logger.child('[CallRole]');
    private botClient: Client | null = null;

    setBotClient(client: Client): void {
        this.botClient = client;
    }

    async addRole(userId: string, config: CallRoleConfig): Promise<boolean> {
        if (!this.isConfigured(config)) return false;

        try {
            const member = await this.fetchMember(config.guildId, userId);
            if (!member) return false;

            if (member.roles.cache.has(config.roleId)) {
                return true;
            }

            await member.roles.add(config.roleId);
            this.logger.info(`Cargo adicionado: ${member.user.tag}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao adicionar cargo: ${error}`);
            return false;
        }
    }

    async removeRole(userId: string, config: CallRoleConfig): Promise<boolean> {
        if (!this.isConfigured(config)) return false;

        try {
            const member = await this.fetchMember(config.guildId, userId);
            if (!member) return false;

            if (!member.roles.cache.has(config.roleId)) {
                return true;
            }

            await member.roles.remove(config.roleId);
            this.logger.info(`Cargo removido: ${member.user.tag}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao remover cargo: ${error}`);
            return false;
        }
    }

    private isConfigured(config: CallRoleConfig): boolean {
        if (!this.botClient) {
            return false;
        }

        if (!config.guildId || !config.roleId) {
            return false;
        }

        return true;
    }

    private async fetchMember(guildId: string, userId: string) {
        try {
            const guild = await this.botClient!.guilds.fetch(guildId);
            return await guild.members.fetch(userId);
        } catch {
            return null;
        }
    }
}

let instance: CallRoleService | null = null;

export const getCallRoleService = (): CallRoleService => {
    if (!instance) {
        instance = new CallRoleService();
    }
    return instance;
};

