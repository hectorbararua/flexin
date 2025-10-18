import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ButtonInteraction, CacheType, ApplicationCommandType, Collection } from "discord.js";
import { Command } from "../../structs/types/command";

// Função para construir o embed
function buildEmbed(user: any): EmbedBuilder {
    const thumbnailUrl = process.env.THUMBNAIL_URL || "https://cdn.discordapp.com/attachments/1234567890/logo.png";
    
    return new EmbedBuilder()
        .setTitle("HiT – Sistema de Panela")
        .setDescription(`Olá, ${user}!\nSeu cargo possui direito a Panela.\n\nUtilize os botões abaixo para gerenciar sua Panela.`)
        .setColor('#4B3B6A')
        .setThumbnail(thumbnailUrl);
}

// Função para construir os componentes (botões)
function buildComponents(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId("panela:antban")
                .setLabel("Antban (5)")
                .setEmoji("🚫")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("panela:primeira_dama")
                .setLabel("Primeira Dama (5)")
                .setEmoji("💍")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("panela:panela")
                .setLabel("Panela (5)")
                .setEmoji("🍳")
                .setStyle(ButtonStyle.Secondary)
        ]
    });
}

// Handler para interações dos botões
async function handlePanelaButton(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const customId = interaction.customId;
    
    switch (customId) {
        case "panela:antban":
            await interaction.reply({
                content: "🚫 **Antban** ativado! Você foi protegido contra bans por 5 minutos.",
                ephemeral: true
            });
            break;
            
        case "panela:primeira_dama":
            await interaction.reply({
                content: "💍 **Primeira Dama** ativada! Você recebeu privilégios especiais por 5 minutos.",
                ephemeral: true
            });
            break;
            
        case "panela:panela":
            await interaction.reply({
                content: "🍳 **Panela** ativada! Você recebeu proteção completa por 5 minutos.",
                ephemeral: true
            });
            break;
            
        default:
            await interaction.reply({
                content: "❌ Ação não reconhecida.",
                ephemeral: true
            });
    }
}

// Exportação padrão do comando
export default new Command({
    name: "panela",
    description: "Sistema de Panela - Gerencie suas proteções especiais",
    type: ApplicationCommandType.ChatInput,
    async run({ interaction }) {
        const embed = buildEmbed(interaction.user);
        const components = buildComponents();
        
        await interaction.reply({
            embeds: [embed],
            components: [components.toJSON()]
        });
    },
    
    // Handlers para os botões
    buttons: new Collection([
        ["panela:antban", handlePanelaButton],
        ["panela:primeira_dama", handlePanelaButton],
        ["panela:panela", handlePanelaButton]
    ])
});
