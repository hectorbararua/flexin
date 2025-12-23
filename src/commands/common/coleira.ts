import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../structs/types/command';
import { getColeiraService } from '../../lib/selfbot';

const coleiraService = getColeiraService();

export default new Command({
    name: 'coleira',
    description: 'Desativar a coleira ativa',
    type: ApplicationCommandType.ChatInput,
    
    async run({ interaction }) {
        const userId = interaction.user.id;
        
        if (!coleiraService.isActive(userId)) {
            await interaction.reply({
                content: '⚠️ **Você não tem nenhuma coleira ativa!**',
                ephemeral: true
            });
            return;
        }
        
        coleiraService.stop(userId);
        
        await interaction.reply({
            content: '🔗 **Coleira desativada com sucesso!**',
            ephemeral: true
        });
    }
});

