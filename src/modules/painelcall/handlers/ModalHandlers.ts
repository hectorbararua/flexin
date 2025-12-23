import { ModalSubmitInteraction, CacheType } from 'discord.js';
import { createCallHandler, CallHandler } from './CallHandler';
import { ModalInteraction } from '../types';

export interface IModalHandlers {
    handleCall(interaction: ModalInteraction): Promise<void>;
    handleCallMuted(interaction: ModalInteraction): Promise<void>;
}

export class ModalHandlers implements IModalHandlers {
    private readonly callHandler: CallHandler;

    constructor() {
        this.callHandler = createCallHandler();
    }

    async handleCall(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
        await this.callHandler.handle(interaction, false);
    }

    async handleCallMuted(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
        await this.callHandler.handle(interaction, true);
    }
}

const modalHandlersInstance = new ModalHandlers();

export const handleCall = modalHandlersInstance.handleCall.bind(modalHandlersInstance);
export const handleCallMuted = modalHandlersInstance.handleCallMuted.bind(modalHandlersInstance);
