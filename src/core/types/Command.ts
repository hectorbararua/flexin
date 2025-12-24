import { 
    ApplicationCommandData, 
    ButtonInteraction, 
    Collection, 
    CommandInteraction, 
    CommandInteractionOptionResolver, 
    ModalSubmitInteraction, 
    StringSelectMenuInteraction 
} from 'discord.js';
import { ExtendedClient } from '../Client';

export interface CommandProps {
    client: ExtendedClient;
    interaction: CommandInteraction;
    options: CommandInteractionOptionResolver;
}

export type ComponentsButton = Collection<string, (interaction: ButtonInteraction) => Promise<void> | void>;
export type ComponentsSelect = Collection<string, (interaction: StringSelectMenuInteraction) => Promise<void> | void>;
export type ComponentsModal = Collection<string, (interaction: ModalSubmitInteraction) => Promise<void> | void>;

export interface CommandComponents {
    buttons?: ComponentsButton;
    selects?: ComponentsSelect;
    modals?: ComponentsModal;
}

export type CommandType = ApplicationCommandData & CommandComponents & {
    run(props: CommandProps): Promise<void> | void;
};

export class Command {
    constructor(options: CommandType) {
        options.dmPermission = false;
        Object.assign(this, options);
    }
}

