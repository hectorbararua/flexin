import { ModalBuilder } from 'discord.js';
import { ModalFactory, TextInputConfig } from '../../../lib/builders';
import { CUSTOM_IDS, INPUT_IDS } from '../constants';

const USER_ID_INPUT: TextInputConfig = {
    customId: INPUT_IDS.USER_ID,
    label: 'ID do Usuário',
    placeholder: 'Cole o ID do usuário aqui...'
};

const RP_NAME_INPUT: TextInputConfig = {
    customId: INPUT_IDS.RP_NAME,
    label: 'Nome da Atividade',
    placeholder: 'Ex: Jogando Valorant'
};

const RP_IMAGE_INPUT: TextInputConfig = {
    customId: INPUT_IDS.RP_IMAGE,
    label: 'Imagem (apenas Discord CDN)',
    placeholder: 'https://cdn.discordapp.com/attachments/...',
    required: false
};

const WHITELIST_ID_INPUT: TextInputConfig = {
    customId: INPUT_IDS.WHITELIST_ID,
    label: 'ID do Usuário',
    placeholder: 'Cole o ID do usuário...'
};

const SERVER_ID_INPUT: TextInputConfig = {
    customId: INPUT_IDS.SERVER_ID,
    label: 'ID do Servidor',
    placeholder: 'Cole o ID do servidor aqui...'
};

const CLONE_SOURCE_INPUT: TextInputConfig = {
    customId: INPUT_IDS.CLONE_SOURCE,
    label: 'ID do Servidor Origem',
    placeholder: 'Cole o ID do servidor que deseja clonar...'
};

const CLONE_TARGET_INPUT: TextInputConfig = {
    customId: INPUT_IDS.CLONE_TARGET,
    label: 'ID do Servidor Destino',
    placeholder: 'Cole o ID do servidor onde criar a estrutura...'
};

export class PainelModalBuilder {
    static buildCLModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_CL,
            title: 'Limpar Conversa',
            inputs: [USER_ID_INPUT]
        });
    }

    static buildCLServidorModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_CL_SERVIDOR,
            title: 'CL Servidor',
            inputs: [SERVER_ID_INPUT]
        });
    }

    static buildRichPresenceModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_RP,
            title: 'Rich Presence',
            inputs: [RP_NAME_INPUT, RP_IMAGE_INPUT]
        });
    }

    static buildWhitelistAddModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_WHITELIST_ADD,
            title: 'Adicionar à Whitelist',
            inputs: [{
                ...WHITELIST_ID_INPUT,
                placeholder: 'Cole o ID do usuário que deseja proteger...'
            }]
        });
    }

    static buildWhitelistRemoveModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_WHITELIST_REMOVE,
            title: 'Remover da Whitelist',
            inputs: [{
                ...WHITELIST_ID_INPUT,
                placeholder: 'Cole o ID do usuário que deseja remover...'
            }]
        });
    }

    static buildCloneModal(): ModalBuilder {
        return ModalFactory.create({
            customId: CUSTOM_IDS.MODAL_CLONAR,
            title: 'Clonar Servidor',
            inputs: [CLONE_SOURCE_INPUT, CLONE_TARGET_INPUT]
        });
    }
}
