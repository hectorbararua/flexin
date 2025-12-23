import { ModalInteraction } from '../types';
import { MESSAGES, INPUT_IDS } from '../constants';
import { Validators } from '../validators';
import { 
    getClientService, 
    getWhitelistService, 
    getNotificationService, 
    ActivityType 
} from '../../../lib/selfbot';
import { clonarServidorHandler } from './ClonarServidorHandler';
import { clServidorHandler } from './CLServidorHandler';

const clientService = getClientService();
const whitelistService = getWhitelistService();
const notificationService = getNotificationService();

export class ModalHandlers {
    static async handleCL(interaction: ModalInteraction): Promise<void> {
        const targetId = Validators.sanitizeInput(
            interaction.fields.getTextInputValue(INPUT_IDS.USER_ID)
        );
        const { id: userId, username } = interaction.user;
        
        await interaction.deferReply({ ephemeral: true });
        
        const client = await clientService.ensureClient(userId, username);
        
        if (!client) {
            await interaction.editReply({ content: MESSAGES.ERRORS.CLIENT_OFFLINE });
            return;
        }
        
        await interaction.editReply({
            content: MESSAGES.PROCESSING.CL(targetId)
        });
        
        const result = await client.dmService.cleanById(client.client, targetId);
        
        await notificationService.notifyCL(userId, targetId, result.deleted);
        
        const typeEmoji = result.type === 'group' ? '👥' : '👤';
        const typeLabel = result.type === 'group' ? 'Grupo' : 'Usuário';
        
        await interaction.editReply({
            content: `✅ **Limpeza concluída!**\n\n${typeEmoji} **${typeLabel}:** ${result.name}\n🗑️ **Mensagens deletadas:** ${result.deleted}`
        });
    }

    static async handleRichPresence(interaction: ModalInteraction): Promise<void> {
        const activityName = Validators.sanitizeInput(
            interaction.fields.getTextInputValue(INPUT_IDS.RP_NAME)
        );
        const imageURL = interaction.fields.getTextInputValue(INPUT_IDS.RP_IMAGE) || undefined;
        const { id: userId, username } = interaction.user;
        
        await interaction.deferReply({ ephemeral: true });
        
        if (imageURL && !Validators.isDiscordCDN(imageURL)) {
            await interaction.editReply({ content: MESSAGES.ERRORS.INVALID_URL });
            return;
        }
        
        const client = await clientService.ensureClient(userId, username);
        
        if (!client) {
            await interaction.editReply({ content: MESSAGES.ERRORS.CLIENT_OFFLINE });
            return;
        }
        
        const success = await client.activityService.setActivity(client.client, {
            name: activityName,
            type: ActivityType.PLAYING,
            startTimestamp: true,
            imageUrl: imageURL
        });
        
        if (success) {
            let response = MESSAGES.RICH_PRESENCE.SUCCESS(activityName);
            if (imageURL) response += MESSAGES.RICH_PRESENCE.WITH_IMAGE;
            response += MESSAGES.RICH_PRESENCE.TIP;
            response += MESSAGES.RICH_PRESENCE.NOT_SHOWING;
            
            await interaction.editReply({ content: response });
        } else {
            await interaction.editReply({ content: MESSAGES.RICH_PRESENCE.ERROR });
        }
    }

    static async handleWhitelistAdd(interaction: ModalInteraction): Promise<void> {
        const targetId = Validators.sanitizeInput(
            interaction.fields.getTextInputValue(INPUT_IDS.WHITELIST_ID)
        );
        const userId = interaction.user.id;
        
        if (!Validators.isValidDiscordId(targetId)) {
            await interaction.reply({ content: MESSAGES.ERRORS.INVALID_ID, ephemeral: true });
            return;
        }
        
        const added = whitelistService.addId(userId, targetId);
        const total = whitelistService.getCount(userId);
        
        const message = added 
            ? MESSAGES.WHITELIST.ADDED(targetId, total)
            : MESSAGES.WHITELIST.ALREADY_EXISTS(targetId);
        
        await interaction.reply({ content: message, ephemeral: true });
    }

    static async handleWhitelistRemove(interaction: ModalInteraction): Promise<void> {
        const targetId = Validators.sanitizeInput(
            interaction.fields.getTextInputValue(INPUT_IDS.WHITELIST_ID)
        );
        const userId = interaction.user.id;
        
        const removed = whitelistService.removeId(userId, targetId);
        const total = whitelistService.getCount(userId);
        
        const message = removed 
            ? MESSAGES.WHITELIST.REMOVED(targetId, total)
            : MESSAGES.WHITELIST.NOT_FOUND(targetId);
        
        await interaction.reply({ content: message, ephemeral: true });
    }

    static async handleClonar(interaction: ModalInteraction): Promise<void> {
        await clonarServidorHandler.handle(interaction);
    }

    static async handleCLServidor(interaction: ModalInteraction): Promise<void> {
        await clServidorHandler.handle(interaction);
    }
}
