export interface Feedback {
    id: string;
    odCoachId: string;
    odStudentId: string;
    studentUsername: string;
    studentDisplayName: string;
    studentAvatarUrl: string;
    rating: FeedbackRating;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface CoachFeedbackStats {
    totalReviews: number;
    averageRating: number;
    ratings: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface FeedbackData {
    feedbacks: Feedback[];
    [key: string]: unknown;
}

export function extractFeedbackUserInfo(user: { id: string; username: string; displayName?: string; avatarURL: (options?: { size?: number }) => string | null }) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarURL({ size: 128 }) || `https://cdn.discordapp.com/embed/avatars/0.png`,
    };
}

export function generateFeedbackId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
