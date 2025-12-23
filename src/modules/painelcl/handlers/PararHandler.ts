import { SelectInteraction } from '../types';
import { MESSAGES } from '../constants';
import { BaseHandler } from './BaseHandler';
import { getGuildService, getGuildCloneService } from '../../../lib/selfbot';
import { clServidorHandler } from './CLServidorHandler';

const guildService = getGuildService();
const cloneService = getGuildCloneService();

export class PararHandler extends BaseHandler {
    async handle(interaction: SelectInteraction): Promise<void> {
        const client = await this.getClient(interaction);
        
        let stopped = false;
        
        if (client) {
            stopped = this.stopClientServices(client) || stopped;
        }
        
        stopped = this.stopGlobalServices() || stopped;
        
        const message = stopped 
            ? MESSAGES.SUCCESS.ACTIONS_STOPPED 
            : MESSAGES.ERRORS.NO_ACTION;
        
        await interaction.editReply({ content: message });
    }

    private stopClientServices(client: NonNullable<Awaited<ReturnType<typeof this.getClient>>>): boolean {
        let stopped = false;

        if (client.dmService.isRunning()) {
            client.dmService.stop();
            stopped = true;
        }
        
        if (client.friendService.isRunning()) {
            client.friendService.stop();
            stopped = true;
        }

        return stopped;
    }

    private stopGlobalServices(): boolean {
        let stopped = false;

        if (guildService.isRunning()) {
            guildService.stop();
            stopped = true;
        }

        if (cloneService.isCloning()) {
            cloneService.stop();
            stopped = true;
        }

        if (clServidorHandler.isRunning()) {
            clServidorHandler.stop();
            stopped = true;
        }

        return stopped;
    }
}

export const pararHandler = new PararHandler();
