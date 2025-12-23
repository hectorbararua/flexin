import { 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ModalBuilder 
} from 'discord.js';

export interface TextInputConfig {
    readonly customId: string;
    readonly label: string;
    readonly placeholder: string;
    readonly required?: boolean;
    readonly style?: TextInputStyle;
    readonly minLength?: number;
    readonly maxLength?: number;
}

export class TextInputFactory {
    static create(config: TextInputConfig): TextInputBuilder {
        const input = new TextInputBuilder()
            .setCustomId(config.customId)
            .setLabel(config.label)
            .setPlaceholder(config.placeholder)
            .setStyle(config.style ?? TextInputStyle.Short)
            .setRequired(config.required ?? true);

        if (config.minLength !== undefined) {
            input.setMinLength(config.minLength);
        }

        if (config.maxLength !== undefined) {
            input.setMaxLength(config.maxLength);
        }

        return input;
    }

    static createRow(config: TextInputConfig): ActionRowBuilder<TextInputBuilder> {
        return new ActionRowBuilder<TextInputBuilder>()
            .addComponents(this.create(config));
    }

    static createRows(configs: TextInputConfig[]): ActionRowBuilder<TextInputBuilder>[] {
        return configs.map(config => this.createRow(config));
    }
}

export interface ModalConfig {
    readonly customId: string;
    readonly title: string;
    readonly inputs: TextInputConfig[];
}

export class ModalFactory {
    static create(config: ModalConfig): ModalBuilder {
        const modal = new ModalBuilder()
            .setCustomId(config.customId)
            .setTitle(config.title);

        const rows = TextInputFactory.createRows(config.inputs);
        modal.addComponents(...rows);

        return modal;
    }
}

