import { SelectInteraction, PainelOption, OPTIONS_REQUIRING_DEFER, OPTIONS_WITHOUT_TOKEN_CHECK } from '../types';
import { MESSAGES } from '../constants';
import { PainelEmbedBuilder, ComponentBuilder, PainelModalBuilder } from '../builders';
import { getClientService, getWhitelistService } from '../../../lib/selfbot';
import { pararHandler } from './PararHandler';
import { limparTudoHandler } from './LimparTudoHandler';
import { apagarDMsHandler } from './ApagarDMsHandler';
import { fecharDMsHandler } from './FecharDMsHandler';
import { removerAmigosHandler } from './RemoverAmigosHandler';
import { sairServidoresHandler } from './SairServidoresHandler';
import { clonarServidorHandler } from './ClonarServidorHandler';
import { clServidorHandler } from './CLServidorHandler';

const clientService = getClientService();
const whitelistService = getWhitelistService();

export class SelectHandler {
    static async handle(interaction: SelectInteraction): Promise<void> {
        const selected = interaction.values[0] as PainelOption;
        const userId = interaction.user.id;
        
        const needsDefer = OPTIONS_REQUIRING_DEFER.includes(selected);
        
        if (needsDefer) {
            await interaction.deferReply({ ephemeral: true });
        }
        
        if (!this.canProceedWithoutToken(selected) && !clientService.hasToken(userId)) {
            await this.replyTokenRequired(interaction, needsDefer);
            await this.resetSelectMenu(interaction);
            return;
        }
        
        try {
            await this.routeToHandler(interaction, selected);
            await this.resetSelectMenu(interaction);
        } catch (error: any) {
            await this.resetSelectMenu(interaction);
            if (error.code === 10062) return;
            throw error;
        }
    }

    private static canProceedWithoutToken(option: PainelOption): boolean {
        return OPTIONS_WITHOUT_TOKEN_CHECK.includes(option);
    }

    private static async replyTokenRequired(interaction: SelectInteraction, needsDefer: boolean): Promise<void> {
        const message = MESSAGES.ERRORS.TOKEN_REQUIRED;
        
        if (needsDefer) {
            await interaction.editReply({ content: message });
        } else {
            await interaction.reply({ content: message, ephemeral: true });
        }
    }

    private static async routeToHandler(interaction: SelectInteraction, option: PainelOption): Promise<void> {
        switch (option) {
            case PainelOption.CL:
                await interaction.showModal(PainelModalBuilder.buildCLModal());
                break;
            
            case PainelOption.CL_SERVIDOR:
                await interaction.showModal(PainelModalBuilder.buildCLServidorModal());
                break;
                
            case PainelOption.LIMPAR_TUDO:
                await limparTudoHandler.handle(interaction);
                break;
                
            case PainelOption.APAGAR_DMS:
                await apagarDMsHandler.handle(interaction);
                break;
                
            case PainelOption.FECHAR_DMS:
                await fecharDMsHandler.handle(interaction);
                break;
                
            case PainelOption.PARAR:
                await pararHandler.handle(interaction);
                break;
                
            case PainelOption.RICH_PRESENCE:
                await interaction.showModal(PainelModalBuilder.buildRichPresenceModal());
                break;
                
            case PainelOption.WHITELIST:
                await this.showWhitelistMenu(interaction);
                break;
                
            case PainelOption.REMOVER_AMIGOS:
                await removerAmigosHandler.handle(interaction);
                break;
                
            case PainelOption.SAIR_SERVIDORES:
                await sairServidoresHandler.handle(interaction);
                break;
                
            case PainelOption.CLONAR_SERVIDOR:
                await interaction.showModal(PainelModalBuilder.buildCloneModal());
                break;
                
            default:
                await interaction.reply({ content: MESSAGES.ERRORS.OPTION_NOT_FOUND, ephemeral: true });
        }
    }

    private static async showWhitelistMenu(interaction: SelectInteraction): Promise<void> {
        const count = whitelistService.getCount(interaction.user.id);
        const embed = PainelEmbedBuilder.buildWhitelistEmbed(count);
        const buttons = ComponentBuilder.buildWhitelistButtons();
        
        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }

    private static async resetSelectMenu(interaction: SelectInteraction): Promise<void> {
        try {
            const embed = PainelEmbedBuilder.buildPainelEmbed();
            const selectMenu = ComponentBuilder.buildSelectMenu();
            
            await interaction.webhook.editMessage(interaction.message.id, {
                embeds: [embed],
                components: [selectMenu]
            });
        } catch {
            try {
                await interaction.message.edit({
                    embeds: [PainelEmbedBuilder.buildPainelEmbed()],
                    components: [ComponentBuilder.buildSelectMenu()]
                });
            } catch {}
        }
    }
}
