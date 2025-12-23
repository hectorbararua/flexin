import { EmbedBuilder } from 'discord.js';
import { PAINEL_CONFIG, COLORS } from '../constants';

export class PainelEmbedBuilder {
    static buildPainelEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(PAINEL_CONFIG.TITLE)
            .setDescription(PAINEL_CONFIG.DESCRIPTION)
            .setColor(COLORS.PRIMARY)
            .setImage(PAINEL_CONFIG.IMAGE)
            .setFooter({ text: PAINEL_CONFIG.FOOTER });
    }

    static buildWhitelistEmbed(count: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('🛡️ Sistema de Whitelist')
            .setDescription(
                `Gerencie os IDs de whitelist dos "Limpar Tudo" e "Apagar DMs".\n` +
                `Os IDs incluídos na whitelist **não serão afetados** pelo CL.\n\n` +
                `📊 **Status atual:**\n` +
                `${count} ID${count !== 1 ? 's' : ''} protegido${count !== 1 ? 's' : ''} na whitelist;\n\n` +
                `**Como funciona:**\n` +
                `• **Add Id:** Adiciona um ID à whitelist.\n` +
                `• **Remove Id:** Remove um ID da whitelist.\n` +
                `• **Listar Id:** Exibe todos os IDs protegidos na whitelist.`
            )
            .setColor(COLORS.PRIMARY)
            .setFooter({ text: 'Whitelist' });
    }
}

