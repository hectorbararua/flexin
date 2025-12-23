import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../structs/types/command';
import { createDeactivateHandler } from './handlers';

const handler = createDeactivateHandler();

export default new Command({
    name: 'desativar',
    description: 'Desativa o Rich Presence da sua conta',
    type: ApplicationCommandType.ChatInput,

    async run({ interaction }) {
        await handler.handle(interaction);
    }
});

