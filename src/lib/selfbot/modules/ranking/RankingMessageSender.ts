import { EmbedBuilder, TextChannel, Message } from 'discord.js';
import { IRankingMessageSender } from './types';
import { Logger } from '../../utils/Logger';

export class RankingMessageSender implements IRankingMessageSender {
    private readonly logger = Logger.child('[RankingMsg]');
    private messageId: string | null = null;
    private botUserId: string | null = null;

    setBotUserId(userId: string): void {
        this.botUserId = userId;
    }

    async sendOrUpdate(channel: TextChannel, embed: EmbedBuilder): Promise<void> {
        try {
            if (await this.tryEditExisting(channel, embed)) {
                return;
            }

            await this.findAndUpdateOrCreate(channel, embed);
        } catch (error) {
            this.logger.error(`Erro ao enviar/atualizar: ${error}`);
        }
    }

    private async tryEditExisting(channel: TextChannel, embed: EmbedBuilder): Promise<boolean> {
        if (!this.messageId) {
            return false;
        }

        try {
            const message = await channel.messages.fetch(this.messageId);
            await message.edit({ embeds: [embed] });
            return true;
        } catch {
            this.messageId = null;
            return false;
        }
    }

    private async findAndUpdateOrCreate(channel: TextChannel, embed: EmbedBuilder): Promise<void> {
        const existingMessage = await this.findExistingMessage(channel);

        if (existingMessage) {
            await existingMessage.edit({ embeds: [embed] });
            this.messageId = existingMessage.id;
        } else {
            const newMessage = await channel.send({ embeds: [embed] });
            this.messageId = newMessage.id;
        }
    }

    private async findExistingMessage(channel: TextChannel): Promise<Message | null> {
        if (!this.botUserId) {
            return null;
        }

        try {
            const messages = await channel.messages.fetch({ limit: 10 });
            return messages.find(
                (m: Message) => m.author.id === this.botUserId && m.embeds.length > 0
            ) ?? null;
        } catch {
            return null;
        }
    }
}

export const createRankingMessageSender = (): RankingMessageSender => {
    return new RankingMessageSender();
};

