import { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} from 'discord.js';
import { CUSTOM_IDS, EMOJIS, MESSAGES } from '../constants';
import { MenuOption } from '../types';

interface MenuOptionConfig {
    readonly value: MenuOption;
    readonly label: string;
    readonly description: string;
    readonly emoji: string;
}

export interface IComponentBuilder {
    buildSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder>;
}

export class ComponentBuilder implements IComponentBuilder {
    private static readonly OPTIONS: readonly MenuOptionConfig[] = [
        {
            value: MenuOption.CALL,
            label: MESSAGES.OPTIONS.CALL.LABEL,
            description: MESSAGES.OPTIONS.CALL.DESCRIPTION,
            emoji: EMOJIS.CALL
        },
        {
            value: MenuOption.CALL_MUTED,
            label: MESSAGES.OPTIONS.CALL_MUTED.LABEL,
            description: MESSAGES.OPTIONS.CALL_MUTED.DESCRIPTION,
            emoji: EMOJIS.CALL_MUTED
        },
        {
            value: MenuOption.COLEIRA,
            label: MESSAGES.OPTIONS.COLEIRA.LABEL,
            description: MESSAGES.OPTIONS.COLEIRA.DESCRIPTION,
            emoji: EMOJIS.COLEIRA
        },
        {
            value: MenuOption.LEAVE,
            label: MESSAGES.OPTIONS.LEAVE.LABEL,
            description: MESSAGES.OPTIONS.LEAVE.DESCRIPTION,
            emoji: EMOJIS.LEAVE
        }
    ];

    buildSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = this.buildOptions();
        const selectMenu = this.createSelectMenu(options);
        
        return new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);
    }

    private buildOptions(): StringSelectMenuOptionBuilder[] {
        return ComponentBuilder.OPTIONS.map(option => 
            new StringSelectMenuOptionBuilder()
                .setLabel(option.label)
                .setDescription(option.description)
                .setValue(option.value)
                .setEmoji(option.emoji)
        );
    }

    private createSelectMenu(options: StringSelectMenuOptionBuilder[]): StringSelectMenuBuilder {
        return new StringSelectMenuBuilder()
            .setCustomId(CUSTOM_IDS.SELECT)
            .setPlaceholder(MESSAGES.PANEL.PLACEHOLDER)
            .addOptions(options);
    }
}

export const createComponentBuilder = (): ComponentBuilder => {
    return new ComponentBuilder();
};

