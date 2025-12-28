import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import { Profile } from './types';
import { PLATFORM_CONFIGS, CUSTOM_EMOJIS } from './constants';

export class PostButtonBuilder {
    static buildPostButtons(
        videoUrl: string,
        profiles: Profile[],
        likeCount: number
    ): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const buttons: ButtonBuilder[] = [];

        const likeButton = new ButtonBuilder()
            .setCustomId('post_like')
            .setEmoji({ id: '1453553969090658384', name: 'like' })
            .setStyle(ButtonStyle.Secondary);
        
        if (likeCount > 0) {
            likeButton.setLabel(`${likeCount}`);
        }
        
        buttons.push(likeButton);

        for (const profile of profiles) {
            const config = PLATFORM_CONFIGS[profile.platform];
            const emojiMatch = config.emoji.match(/<:(\w+):(\d+)>/);
            
            const profileButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(profile.profileUrl);
            
            if (emojiMatch) {
                profileButton.setEmoji({ id: emojiMatch[2], name: emojiMatch[1] });
            } else {
                profileButton.setEmoji(config.emoji);
            }
            
            buttons.push(profileButton);
        }

        buttons.push(
            new ButtonBuilder()
                .setCustomId('post_delete')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        const maxButtonsPerRow = 5;
        for (let i = 0; i < buttons.length; i += maxButtonsPerRow) {
            const rowButtons = buttons.slice(i, i + maxButtonsPerRow);
            rows.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(rowButtons)
            );
        }

        return rows;
    }

    static buildLikeButton(likeCount: number, hasLiked: boolean): ButtonBuilder {
        const button = new ButtonBuilder()
            .setCustomId('post_like')
            .setEmoji({ id: '1453553969090658384', name: 'like' })
            .setStyle(hasLiked ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        if (likeCount > 0) {
            button.setLabel(`${likeCount}`);
        }
        
        return button;
    }

    static buildCommentButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId('post_comment')
            .setLabel('💬')
            .setStyle(ButtonStyle.Secondary);
    }

    static buildDeleteButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId('post_delete')
            .setLabel('🗑️')
            .setStyle(ButtonStyle.Danger);
    }

    static buildProfileButton(profile: Profile): ButtonBuilder {
        const config = PLATFORM_CONFIGS[profile.platform];
        const emojiMatch = config.emoji.match(/<:(\w+):(\d+)>/);
        
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(profile.profileUrl);
        
        if (emojiMatch) {
            button.setEmoji({ id: emojiMatch[2], name: emojiMatch[1] });
        } else {
            button.setEmoji(config.emoji);
        }
        
        return button;
    }
}
