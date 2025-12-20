import { ApplicationCommandType } from "discord.js";
import { Command } from "../../structs/types/command";
import { getSelfbotManager, SelfbotClient } from "../../lib/selfbot";
import { getTokenService } from "../../lib/selfbot/services";

const tokenService = getTokenService();

async function getUserClient(userId: string): Promise<SelfbotClient | null> {
    const userData = tokenService.getUserToken(userId);
    
    if (!userData?.token || !userData.selfbotClientId) {
        return null;
    }
    
    const manager = getSelfbotManager();
    const client = manager.getClient(userData.selfbotClientId);
    
    if (!client?.isReady()) {
        return null;
    }
    
    return client;
}

export default new Command({
    name: "desativar",
    description: "Desativa o Rich Presence da sua conta",
    type: ApplicationCommandType.ChatInput,

    async run({ interaction }) {
        const { id: userId } = interaction.user;

        await interaction.deferReply({ ephemeral: true });

        try {
            const client = await getUserClient(userId);

            if (!client) {
                await interaction.editReply({
                    content: "❌ **Sua conta não está online!**\n\n" +
                        "Use `/painelcl` → Rich Presence para ativar primeiro."
                });
                return;
            }

            const success = client.activityService.clearActivity(client.client);

            if (success) {
                await interaction.editReply({
                    content: "✅ **Rich Presence desativado!**\n\n" +
                        "Sua atividade foi removida com sucesso."
                });
            } else {
                await interaction.editReply({
                    content: "❌ **Erro ao desativar Rich Presence.**\n\n" +
                        "Tente novamente mais tarde."
                });
            }

        } catch (error) {
            console.error("Erro ao desativar Rich Presence:", error);
            await interaction.editReply({
                content: "❌ **Erro ao desativar Rich Presence.**\n\n" +
                    "Tente novamente mais tarde."
            });
        }
    }
});
