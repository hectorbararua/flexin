import { ButtonInteractionType } from '../types';
import { MESSAGES } from '../constants';
import { PainelModalBuilder } from '../builders';
import { getWhitelistService } from '../../../lib/selfbot';

const whitelistService = getWhitelistService();

export class ButtonHandlers {
    static async handleWhitelistAdd(interaction: ButtonInteractionType): Promise<void> {
        await interaction.showModal(PainelModalBuilder.buildWhitelistAddModal());
    }

    static async handleWhitelistRemove(interaction: ButtonInteractionType): Promise<void> {
        await interaction.showModal(PainelModalBuilder.buildWhitelistRemoveModal());
    }

    static async handleWhitelistList(interaction: ButtonInteractionType): Promise<void> {
        const userId = interaction.user.id;
        const whitelist = whitelistService.getWhitelist(userId);
        
        if (whitelist.length === 0) {
            await interaction.reply({ content: MESSAGES.WHITELIST.EMPTY, ephemeral: true });
            return;
        }
        
        const idList = whitelist
            .map((id: string, index: number) => `${index + 1}. <@${id}>`)
            .join('\n');
        
        await interaction.reply({
            content: MESSAGES.WHITELIST.LIST(whitelist.length, idList),
            ephemeral: true
        });
    }
}

