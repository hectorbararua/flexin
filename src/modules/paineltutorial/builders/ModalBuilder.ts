import { ModalBuilder, TextInputStyle } from 'discord.js';
import { ModalFactory, TextInputConfig } from '../../../lib/builders';
import { CUSTOM_IDS, INPUT_IDS, MESSAGES } from '../constants';

const TOKEN_INPUT: TextInputConfig = {
    customId: INPUT_IDS.TOKEN,
    label: MESSAGES.MODALS.TOKEN.LABEL,
    placeholder: MESSAGES.MODALS.TOKEN.PLACEHOLDER,
    style: TextInputStyle.Paragraph
};

export class PainelModalBuilder {
    static buildTokenModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_TOKEN,
            title: MESSAGES.MODALS.TOKEN.TITLE,
            inputs: [TOKEN_INPUT]
        });
    }
}
