import { StringSelectMenuInteraction, ModalSubmitInteraction, CacheType } from 'discord.js';

export enum MenuOption {
    CALL = 'call',
    CALL_MUTED = 'call_muted',
    LEAVE = 'sair',
    COLEIRA = 'coleira'
}

export interface CallOptions {
    readonly selfMute: boolean;
    readonly selfDeaf: boolean;
}

export interface CallResult {
    readonly success: boolean;
    readonly channelId?: string;
    readonly channelName?: string;
    readonly error?: string;
}

export type SelectInteraction = StringSelectMenuInteraction<CacheType>;
export type ModalInteraction = ModalSubmitInteraction<CacheType>;

export interface ISelectHandler {
    handle(interaction: SelectInteraction): Promise<void>;
}

export interface IModalHandler {
    handle(interaction: ModalInteraction): Promise<void>;
}

export interface ICallService {
    join(channelId: string, options: CallOptions): Promise<CallResult>;
    leave(): Promise<boolean>;
    isInCall(): boolean;
}

