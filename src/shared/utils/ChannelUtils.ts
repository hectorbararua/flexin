import { Client, TextChannel, Message } from 'discord.js';

export class ChannelUtils {
    static async getTextChannel(client: Client, channelId: string): Promise<TextChannel | null> {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
                console.error(`Channel ${channelId} not found or is not a text channel`);
                return null;
            }
            return channel as TextChannel;
        } catch (error) {
            console.error(`Error fetching channel ${channelId}:`, error);
            return null;
        }
    }

    static async sendTemporaryMessage(
        channel: TextChannel,
        content: string,
        deleteAfterMs: number = 5000
    ): Promise<Message | null> {
        try {
            const message = await channel.send(content);
            setTimeout(() => {
                message.delete().catch(() => {});
            }, deleteAfterMs);
            return message;
        } catch (error) {
            console.error('Error sending temporary message:', error);
            return null;
        }
    }

    static async safeDelete(message: Message): Promise<boolean> {
        try {
            await message.delete();
            return true;
        } catch {
            return false;
        }
    }
}
