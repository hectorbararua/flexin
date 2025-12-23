import { ButtonInteraction, ModalSubmitInteraction, CacheType } from 'discord.js';

export type ButtonInteractionType = ButtonInteraction<CacheType>;
export type ModalInteraction = ModalSubmitInteraction<CacheType>;

export type TutorialPlatform = 'IPHONE' | 'ANDROID' | 'PC';

export interface TutorialConfig {
    readonly showDiscordButton: boolean;
}

export const PLATFORM_CONFIG: Record<TutorialPlatform, TutorialConfig> = {
    IPHONE: { showDiscordButton: false },
    ANDROID: { showDiscordButton: false },
    PC: { showDiscordButton: true }
} as const;
