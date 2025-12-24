import fs from 'fs';
import path from 'path';
import { ApplicationCommandDataResolvable, Collection } from 'discord.js';
import { CommandType, ComponentsButton, ComponentsSelect, ComponentsModal } from '../types';

const isCommandFile = (fileName: string) => 
    (fileName.endsWith('Command.ts') || fileName.endsWith('Command.js'));

export interface LoadedCommands {
    commands: Collection<string, CommandType>;
    slashCommands: ApplicationCommandDataResolvable[];
    buttons: ComponentsButton;
    selects: ComponentsSelect;
    modals: ComponentsModal;
}

export class CommandLoader {
    private modulesPath: string;

    constructor() {
        this.modulesPath = path.join(__dirname, '../../modules');
    }

    async load(): Promise<LoadedCommands> {
        const commands = new Collection<string, CommandType>();
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const buttons: ComponentsButton = new Collection();
        const selects: ComponentsSelect = new Collection();
        const modals: ComponentsModal = new Collection();

        if (!fs.existsSync(this.modulesPath)) {
            return { commands, slashCommands, buttons, selects, modals };
        }

        const modules = fs.readdirSync(this.modulesPath);

        for (const moduleName of modules) {
            const modulePath = path.join(this.modulesPath, moduleName);
            const stat = fs.statSync(modulePath);

            if (stat.isDirectory()) {
                await this.loadModuleCommands(
                    modulePath, 
                    commands, 
                    slashCommands, 
                    buttons, 
                    selects, 
                    modals
                );
            }
        }

        return { commands, slashCommands, buttons, selects, modals };
    }

    private async loadModuleCommands(
        modulePath: string,
        commands: Collection<string, CommandType>,
        slashCommands: ApplicationCommandDataResolvable[],
        buttons: ComponentsButton,
        selects: ComponentsSelect,
        modals: ComponentsModal
    ): Promise<void> {
        const files = fs.readdirSync(modulePath).filter(isCommandFile);

        for (const file of files) {
            try {
                const filePath = path.join(modulePath, file);
                const command: CommandType = (await import(filePath))?.default;

                if (command?.name) {
                    commands.set(command.name, command);
                    slashCommands.push(command);

                    if (command.buttons) {
                        command.buttons.forEach((run, key) => buttons.set(key, run));
                    }
                    if (command.selects) {
                        command.selects.forEach((run, key) => selects.set(key, run));
                    }
                    if (command.modals) {
                        command.modals.forEach((run, key) => modals.set(key, run));
                    }
                }
            } catch (error) {
                console.log(`❌ Error loading command from ${file}:`.red, error);
            }
        }
    }
}

