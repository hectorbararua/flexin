import { JsonRepository } from '../../shared/repositories/JsonRepository';
import { Platform, Post, PostData } from './types';

export class PostRepository {
    private repository: JsonRepository<PostData>;

    constructor() {
        this.repository = new JsonRepository<PostData>('posts.json');
    }

    getAll(): PostData {
        return this.repository.getAll();
    }

    get(messageId: string): Post | undefined {
        return this.repository.get(messageId) as Post | undefined;
    }

    exists(messageId: string): boolean {
        return !!this.get(messageId);
    }

    create(
        messageId: string,
        channelId: string,
        authorId: string,
        platform: Platform,
        videoUrl: string,
        description: string
    ): Post {
        const post: Post = {
            id: this.generateId(),
            messageId,
            channelId,
            authorId,
            platform,
            videoUrl,
            description,
            likes: [],
            createdAt: new Date().toISOString(),
        };

        this.repository.set(messageId, post as unknown as PostData[keyof PostData]);
        return post;
    }

    delete(messageId: string): boolean {
        if (!this.exists(messageId)) {
            return false;
        }
        this.repository.delete(messageId);
        return true;
    }

    addLike(messageId: string, userId: string): boolean {
        const post = this.get(messageId);
        if (!post) return false;

        if (post.likes.includes(userId)) {
            return false;
        }

        post.likes.push(userId);
        this.repository.set(messageId, post as unknown as PostData[keyof PostData]);
        return true;
    }

    removeLike(messageId: string, userId: string): boolean {
        const post = this.get(messageId);
        if (!post) return false;

        const index = post.likes.indexOf(userId);
        if (index === -1) {
            return false;
        }

        post.likes.splice(index, 1);
        this.repository.set(messageId, post as unknown as PostData[keyof PostData]);
        return true;
    }

    toggleLike(messageId: string, userId: string): { liked: boolean; count: number } {
        const post = this.get(messageId);
        if (!post) return { liked: false, count: 0 };

        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            this.removeLike(messageId, userId);
        } else {
            this.addLike(messageId, userId);
        }

        const updatedPost = this.get(messageId)!;
        return { liked: !hasLiked, count: updatedPost.likes.length };
    }

    getLikeCount(messageId: string): number {
        const post = this.get(messageId);
        return post ? post.likes.length : 0;
    }

    hasLiked(messageId: string, userId: string): boolean {
        const post = this.get(messageId);
        return post ? post.likes.includes(userId) : false;
    }

    setThreadId(messageId: string, threadId: string): void {
        const post = this.get(messageId);
        if (!post) return;

        post.threadId = threadId;
        this.repository.set(messageId, post as unknown as PostData[keyof PostData]);
    }

    getByAuthor(authorId: string): Post[] {
        const allPosts = this.getAll();
        return Object.values(allPosts).filter(post => (post as Post).authorId === authorId) as Post[];
    }

    getByPlatform(platform: Platform): Post[] {
        const allPosts = this.getAll();
        return Object.values(allPosts).filter(post => (post as Post).platform === platform) as Post[];
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}

export const postRepository = new PostRepository();

