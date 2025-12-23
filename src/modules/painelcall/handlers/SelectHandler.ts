import { StringSelectMenuInteraction, CacheType } from 'discord.js';
import { BaseHandler } from './BaseHandler';
import { getClientService } from './ClientService';
import { createLeaveHandler, LeaveHandler } from './LeaveHandler';
import { PainelModalBuilder } from '../builders/ModalBuilder';
import { MESSAGES } from '../constants';
import { MenuOption, SelectInteraction } from '../types';

export interface ISelectHandler {
    handle(interaction: SelectInteraction): Promise<void>;
}

export class SelectHandler extends BaseHandler implements ISelectHandler {
    private readonly clientService = getClientService();
    private readonly modalBuilder: PainelModalBuilder;
    private readonly leaveHandler: LeaveHandler;

    constructor() {
        super();
        this.modalBuilder = new PainelModalBuilder();
        this.leaveHandler = createLeaveHandler();
    }

    async handle(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        const selected = interaction.values[0] as MenuOption;
        
        try {
            await this.routeToHandler(interaction, selected);
        } finally {
            await this.resetSelectMenu(interaction);
        }
    }

    private async routeToHandler(
        interaction: StringSelectMenuInteraction<CacheType>,
        selected: MenuOption
    ): Promise<void> {
        switch (selected) {
            case MenuOption.CALL:
                await this.handleCall(interaction, false);
                break;
                
            case MenuOption.CALL_MUTED:
                await this.handleCall(interaction, true);
                break;
                
            case MenuOption.COLEIRA:
                await this.handleColeira(interaction);
                break;
                
            case MenuOption.LEAVE:
                await this.leaveHandler.handle(interaction);
                break;
                
            default:
                await this.handleUnknown(interaction);
        }
    }

    private async handleCall(
        interaction: StringSelectMenuInteraction<CacheType>,
        isMuted: boolean
    ): Promise<void> {
        const userId = interaction.user.id;
        
        if (!this.clientService.hasToken(userId)) {
            await this.sendEphemeralReply(interaction, MESSAGES.RESPONSES.NO_TOKEN);
            return;
        }
        
        const modal = this.modalBuilder.buildCallModal(isMuted);
        await interaction.showModal(modal);
    }

    private async handleColeira(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        const userId = interaction.user.id;
        
        if (!this.clientService.hasToken(userId)) {
            await this.sendEphemeralReply(interaction, MESSAGES.RESPONSES.NO_TOKEN);
            return;
        }
        
        const modal = this.modalBuilder.buildColeiraModal();
        await interaction.showModal(modal);
    }

    private async handleUnknown(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        await this.sendEphemeralReply(interaction, MESSAGES.RESPONSES.UNKNOWN_OPTION);
    }
}

export const createSelectHandler = (): SelectHandler => {
    return new SelectHandler();
};

export const selectHandler = new SelectHandler();

