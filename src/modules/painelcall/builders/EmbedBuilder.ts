import { EmbedBuilder } from 'discord.js';
import { MESSAGES, COLORS } from '../constants';

export interface IPainelEmbedBuilder {
    buildPainelEmbed(): EmbedBuilder;
}

export class PainelEmbedBuilder implements IPainelEmbedBuilder {
    buildPainelEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(MESSAGES.PANEL.TITLE)
            .setDescription(MESSAGES.PANEL.DESCRIPTION)
            .setColor(COLORS.PRIMARY)
            .setImage(MESSAGES.PANEL.IMAGE)
            .setFooter({ text: MESSAGES.PANEL.PLACEHOLDER });
    }
}

export const createPainelEmbedBuilder = (): PainelEmbedBuilder => {
    return new PainelEmbedBuilder();
};

