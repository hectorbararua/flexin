import { StringSelectMenuInteraction, ModalSubmitInteraction, ButtonInteraction, CacheType } from 'discord.js';

export type SelectInteraction = StringSelectMenuInteraction<CacheType>;
export type ModalInteraction = ModalSubmitInteraction<CacheType>;
export type ButtonInteractionType = ButtonInteraction<CacheType>;

export interface UserContext {
    readonly userId: string;
    readonly username: string;
}

export interface OperationResult {
    readonly success: boolean;
    readonly message: string;
}

export enum PainelOption {
    CL = 'cl',
    CL_SERVIDOR = 'cl_servidor',
    LIMPAR_TUDO = 'limpar_tudo',
    APAGAR_DMS = 'apagar_dms',
    FECHAR_DMS = 'fechar_dms',
    PARAR = 'parar',
    RICH_PRESENCE = 'rich_presence',
    WHITELIST = 'whitelist',
    REMOVER_AMIGOS = 'remover_amigos',
    SAIR_SERVIDORES = 'sair_servidores',
    CLONAR_SERVIDOR = 'clonar_servidor'
}

export const OPTIONS_REQUIRING_DEFER: readonly PainelOption[] = [
    PainelOption.LIMPAR_TUDO,
    PainelOption.APAGAR_DMS,
    PainelOption.FECHAR_DMS,
    PainelOption.PARAR,
    PainelOption.REMOVER_AMIGOS,
    PainelOption.SAIR_SERVIDORES
] as const;

export const OPTIONS_WITHOUT_TOKEN_CHECK: readonly PainelOption[] = [
    PainelOption.PARAR,
    PainelOption.CL,
    PainelOption.CL_SERVIDOR,
    PainelOption.RICH_PRESENCE,
    PainelOption.WHITELIST,
    PainelOption.CLONAR_SERVIDOR
] as const;
