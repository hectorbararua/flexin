import { ModalInteraction } from '../types';
import { MESSAGES, INPUT_IDS } from '../constants';
import { getTokenService, getClientService } from '../../../lib/selfbot';
import { Validators } from '../../../lib/validators';

const tokenService = getTokenService();
const clientService = getClientService();

const ROLE_CONFIG = {
    GUILD_ID: '1453013291734401249',
    ROLE_ID: '1453031454257713192'
} as const;

export class ModalHandlers {
    static async handleToken(interaction: ModalInteraction): Promise<void> {
        const token = interaction.fields.getTextInputValue(INPUT_IDS.TOKEN).trim();
        const { id: userId, username } = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        if (!Validators.validateToken(token).isValid) {
            await interaction.editReply({ content: MESSAGES.ERRORS.INVALID_TOKEN });
            return;
        }

        await this.validateAndSaveToken(interaction, userId, username, token);
    }

    private static async validateAndSaveToken(
        interaction: ModalInteraction,
        userId: string,
        username: string,
        token: string
    ): Promise<void> {
        try {
            const isUpdate = tokenService.getUserToken(userId)?.token !== undefined;
            
            tokenService.saveUserToken(userId, username, token);
            
            const client = await clientService.ensureClient(userId, username);
            
            if (!client) {
                tokenService.deleteUserToken(userId);
                await interaction.editReply({ content: MESSAGES.ERRORS.TOKEN_EXPIRED });
                return;
            }

            const tag = client.client.user?.tag || 'Conectado';
            
            await this.giveRole(interaction, userId);
            
            const message = isUpdate 
                ? MESSAGES.SUCCESS.TOKEN_UPDATED(tag)
                : MESSAGES.SUCCESS.TOKEN_SAVED(tag);

            await interaction.editReply({ content: message });
        } catch {
            tokenService.deleteUserToken(userId);
            await interaction.editReply({ content: MESSAGES.ERRORS.TOKEN_SAVE_FAILED });
        }
    }

    private static async giveRole(interaction: ModalInteraction, userId: string): Promise<void> {
        try {
            const guild = await interaction.client.guilds.fetch(ROLE_CONFIG.GUILD_ID);
            const member = await guild.members.fetch(userId);
            const role = await guild.roles.fetch(ROLE_CONFIG.ROLE_ID);
            
            if (role && !member.roles.cache.has(ROLE_CONFIG.ROLE_ID)) {
                await member.roles.add(role);
            }
        } catch {}
    }
}
