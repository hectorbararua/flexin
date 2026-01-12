import * as fs from 'fs';
import * as path from 'path';
import { Feedback, FeedbackData, CoachFeedbackStats } from './types';

const FEEDBACK_FILE = path.join(process.cwd(), 'src', 'data', 'feedbacks.json');

export class FeedbackRepository {
    private data: FeedbackData;

    constructor() {
        this.data = this.loadData();
    }

    private loadData(): FeedbackData {
        try {
            if (fs.existsSync(FEEDBACK_FILE)) {
                const content = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
                return JSON.parse(content);
            }
        } catch { }
        return { feedbacks: [] };
    }

    private saveData(): void {
        try {
            const dir = path.dirname(FEEDBACK_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(this.data, null, 2));
        } catch { }
    }

    createFeedback(feedback: Feedback): Feedback {
        this.data.feedbacks.push(feedback);
        this.saveData();
        return feedback;
    }

    updateFeedback(feedbackId: string, updates: Partial<Feedback>): Feedback | null {
        const index = this.data.feedbacks.findIndex(f => f.id === feedbackId);
        if (index === -1) return null;

        this.data.feedbacks[index] = {
            ...this.data.feedbacks[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.saveData();
        return this.data.feedbacks[index];
    }

    deleteFeedback(feedbackId: string): boolean {
        const initialLength = this.data.feedbacks.length;
        this.data.feedbacks = this.data.feedbacks.filter(f => f.id !== feedbackId);

        if (this.data.feedbacks.length < initialLength) {
            this.saveData();
            return true;
        }
        return false;
    }

    getFeedbackById(feedbackId: string): Feedback | undefined {
        return this.data.feedbacks.find(f => f.id === feedbackId);
    }

    getFeedbackByStudentAndCoach(studentId: string, coachId: string): Feedback | undefined {
        return this.data.feedbacks.find(
            f => f.odStudentId === studentId && f.odCoachId === coachId
        );
    }

    getFeedbacksByCoach(coachId: string): Feedback[] {
        return this.data.feedbacks.filter(f => f.odCoachId === coachId);
    }

    getFeedbacksByStudent(studentId: string): Feedback[] {
        return this.data.feedbacks.filter(f => f.odStudentId === studentId);
    }

    getCoachFeedbackStats(coachId: string): CoachFeedbackStats {
        const feedbacks = this.getFeedbacksByCoach(coachId);

        const stats: CoachFeedbackStats = {
            totalReviews: feedbacks.length,
            averageRating: 0,
            ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };

        if (feedbacks.length === 0) return stats;

        let totalRating = 0;
        for (const feedback of feedbacks) {
            totalRating += feedback.rating;
            stats.ratings[feedback.rating]++;
        }

        stats.averageRating = totalRating / feedbacks.length;
        return stats;
    }

    hasStudentReviewedCoach(studentId: string, coachId: string): boolean {
        return this.data.feedbacks.some(
            f => f.odStudentId === studentId && f.odCoachId === coachId
        );
    }

    getRecentFeedbacksByCoach(coachId: string, limit: number = 5): Feedback[] {
        return this.getFeedbacksByCoach(coachId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }
}

export const feedbackRepository = new FeedbackRepository();
