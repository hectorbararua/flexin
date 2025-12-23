import { StringSelectMenuInteraction, CacheType } from 'discord.js';
import { PainelEmbedBuilder } from '../builders/EmbedBuilder';
import { ComponentBuilder } from '../builders/ComponentBuilder';

export interface IBaseHandler {
    resetSelectMenu(interaction: StringSelectMenuInteraction<CacheType>): Promise<void>;
}

export abstract class BaseHandler implements IBaseHandler {
    protected readonly embedBuilder: PainelEmbedBuilder;
    protected readonly componentBuilder: ComponentBuilder;

    constructor() {
        this.embedBuilder = new PainelEmbedBuilder();
        this.componentBuilder = new ComponentBuilder();
    }

    async resetSelectMenu(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        try {
            await this.resetViaWebhook(interaction);
        } catch {
            await this.resetViaMessage(interaction);
        }
    }

    private async resetViaWebhook(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        const embed = this.embedBuilder.buildPainelEmbed();
        const selectMenu = this.componentBuilder.buildSelectMenu();
        
        await interaction.webhook.editMessage(interaction.message.id, {
            embeds: [embed],
            components: [selectMenu]
        });
    }

    private async resetViaMessage(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        try {
            await interaction.message.edit({
                embeds: [this.embedBuilder.buildPainelEmbed()],
                components: [this.componentBuilder.buildSelectMenu()]
            });
        } catch {}
    }

    protected async sendEphemeralReply(
        interaction: StringSelectMenuInteraction<CacheType>, 
        content: string
    ): Promise<void> {
        await interaction.reply({ content, ephemeral: true });
    }
}

