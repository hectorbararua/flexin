import { ModalBuilder } from 'discord.js';
import { ModalFactory, TextInputConfig } from '../../../lib/builders';
import { CUSTOM_IDS, INPUT_IDS, MESSAGES } from '../constants';

const CALL_ID_INPUT: TextInputConfig = {
    customId: INPUT_IDS.CALL_ID,
    label: MESSAGES.MODALS.CALL.LABEL,
    placeholder: MESSAGES.MODALS.CALL.PLACEHOLDER
};

const COLEIRA_USER_INPUT: TextInputConfig = {
    customId: INPUT_IDS.COLEIRA_USER_ID,
    label: MESSAGES.MODALS.COLEIRA.LABEL,
    placeholder: MESSAGES.MODALS.COLEIRA.PLACEHOLDER
};

export interface IModalBuilder {
    buildCallModal(isMuted: boolean): ModalBuilder;
    buildColeiraModal(): ModalBuilder;
}

export class PainelModalBuilder implements IModalBuilder {
    buildCallModal(isMuted: boolean): ModalBuilder {
        const customId = isMuted ? CUSTOM_IDS.MODAL_CALL_MUTED : CUSTOM_IDS.MODAL_CALL;
        const title = isMuted ? MESSAGES.MODALS.CALL.TITLE_MUTED : MESSAGES.MODALS.CALL.TITLE;

        return ModalFactory.create({
            customId,
            title,
            inputs: [CALL_ID_INPUT]
        });
    }

    buildColeiraModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_COLEIRA,
            title: MESSAGES.MODALS.COLEIRA.TITLE,
            inputs: [COLEIRA_USER_INPUT]
        });
    }
}

export const createModalBuilder = (): PainelModalBuilder => {
    return new PainelModalBuilder();
};
