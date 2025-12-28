import { Event } from '../core/types';
import { postService } from '../modules/influencer/PostService';
import { commandManager } from '../modules/commands';

export default new Event({
    name: 'messageCreate',
    async run(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const content = message.content.trim();

        if (commandManager.isCommand(content)) {
            await commandManager.handleCommand(message);
            return;
        }

        await handleInfluencerPost(message);
    },
});

async function handleInfluencerPost(message: import('discord.js').Message): Promise<void> {
    if (!postService.isConfiguredChannel(message.channel.id)) return;

    const validation = postService.validateMessage(message);

    if (!validation.valid) {
        try {
            await message.delete();
            const dmChannel = await message.author.createDM();
            await dmChannel.send({
                content: `❌ **Sua postagem foi removida**\n\n${validation.error}\n\n_Esta mensagem é automática._`,
            });
        } catch {}
        return;
    }

    const result = await postService.createOfficialPost(
        message,
        validation.platform!,
        validation.videoUrl!,
        validation.description || ''
    );

    if (!result.success) {
        try {
            const dmChannel = await message.author.createDM();
            await dmChannel.send({
                content: `❌ **Erro ao processar sua postagem**\n\n${result.error}\n\n_Esta mensagem é automática._`,
            });
        } catch {}
    }
}
