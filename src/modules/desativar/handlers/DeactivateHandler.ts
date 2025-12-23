import { CommandInteraction, CacheType } from 'discord.js';
import { ActivityDeactivator, createActivityDeactivator } from '../services';
import { MESSAGES } from '../constants';

export interface IDeactivateHandler {
    handle(interaction: CommandInteraction<CacheType>): Promise<void>;
}

export class DeactivateHandler implements IDeactivateHandler {
    private readonly deactivator: ActivityDeactivator;

    constructor(deactivator?: ActivityDeactivator) {
        this.deactivator = deactivator ?? createActivityDeactivator();
    }

    async handle(interaction: CommandInteraction<CacheType>): Promise<void> {
        const userId = interaction.user.id;

        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await this.deactivator.deactivate(userId);
            await this.sendResponse(interaction, result.success, result.error);
        } catch {
            await interaction.editReply({ content: MESSAGES.ERROR.GENERIC });
        }
    }

    private async sendResponse(
        interaction: CommandInteraction<CacheType>,
        success: boolean,
        error?: string
    ): Promise<void> {
        if (error === 'not_online') {
            await interaction.editReply({ content: MESSAGES.ERROR.NOT_ONLINE });
            return;
        }

        const content = success ? MESSAGES.SUCCESS : MESSAGES.ERROR.FAILED;
        await interaction.editReply({ content });
    }
}

export const createDeactivateHandler = (): DeactivateHandler => {
    return new DeactivateHandler();
};

