import { EmbedBuilder } from 'discord.js';
import { PAINEL_CONFIG, COLORS, TUTORIALS } from '../constants';
import { TutorialPlatform } from '../types';

export class PainelEmbedBuilder {
    static buildPainelEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setDescription(PAINEL_CONFIG.DESCRIPTION)
            .setImage(PAINEL_CONFIG.IMAGE)
            .setColor(COLORS.PRIMARY);
    }

    static buildTutorialEmbed(platform: TutorialPlatform): EmbedBuilder {
        const tutorial = TUTORIALS[platform];
        
        return new EmbedBuilder()
            .setTitle(tutorial.TITLE)
            .setDescription(tutorial.STEPS)
            .setColor(COLORS.PRIMARY);
    }

    static buildSuccessEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setDescription(message)
            .setColor(COLORS.SUCCESS);
    }
}
