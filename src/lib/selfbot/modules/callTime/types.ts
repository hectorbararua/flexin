export interface UserCallData {
    readonly odiscordUserId: string;
    readonly username: string;
    readonly totalTime: number;
    readonly sessionStart: number | null;
}

export interface CallTimeData {
    readonly [odiscordUserId: string]: UserCallData;
}

export interface ICallTimeRepository {
    load(): CallTimeData;
    save(data: CallTimeData): void;
}

export interface ICallTimeService {
    startSession(odiscordUserId: string, username: string): void;
    endSession(odiscordUserId: string): number;
    isInSession(odiscordUserId: string): boolean;
    getTotalTime(odiscordUserId: string): number;
    getRanking(limit?: number): UserCallData[];
    formatTime(ms: number): string;
}

