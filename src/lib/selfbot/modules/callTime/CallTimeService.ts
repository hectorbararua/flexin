import { UserCallData, CallTimeData, ICallTimeService, ICallTimeRepository } from './types';
import { ITimeFormatter, createTimeFormatter } from './TimeFormatter';
import { createCallTimeRepository } from './CallTimeRepository';
import { Logger } from '../../utils/Logger';

interface CallTimeServiceDependencies {
    readonly repository: ICallTimeRepository;
    readonly timeFormatter: ITimeFormatter;
}

export class CallTimeService implements ICallTimeService {
    private readonly logger = Logger.child('[CallTime]');
    private readonly repository: ICallTimeRepository;
    private readonly timeFormatter: ITimeFormatter;
    private data: CallTimeData;

    constructor(dependencies?: Partial<CallTimeServiceDependencies>) {
        this.repository = dependencies?.repository ?? createCallTimeRepository();
        this.timeFormatter = dependencies?.timeFormatter ?? createTimeFormatter();
        this.data = this.repository.load();
    }

    startSession(odiscordUserId: string, username: string): void {
        this.data = this.repository.load();
        
        const now = Date.now();
        const existingUser = this.data[odiscordUserId];

        let currentTotalTime = existingUser?.totalTime ?? 0;
        if (existingUser?.sessionStart) {
            const previousSessionTime = now - existingUser.sessionStart;
            if (previousSessionTime > 0) {
                currentTotalTime += previousSessionTime;
                this.logger.info(`Sessão anterior salva: +${this.formatTime(previousSessionTime)}`);
            }
        }

        this.data = {
            ...this.data,
            [odiscordUserId]: {
                odiscordUserId,
                username,
                totalTime: currentTotalTime,
                sessionStart: now
            }
        };

        this.repository.save(this.data);
        this.logger.info(`Sessão iniciada: ${username}`);
    }

    endSession(odiscordUserId: string): number {
        this.data = this.repository.load();
        
        const userData = this.data[odiscordUserId];

        if (!userData?.sessionStart) {
            return 0;
        }

        const sessionTime = Date.now() - userData.sessionStart;
        
        if (sessionTime <= 0) {
            this.logger.warning(`Sessão com tempo inválido: ${sessionTime}ms`);
            return 0;
        }
        
        this.data = {
            ...this.data,
            [odiscordUserId]: {
                ...userData,
                totalTime: userData.totalTime + sessionTime,
                sessionStart: null
            }
        };

        this.repository.save(this.data);
        this.logger.info(`Sessão encerrada: ${userData.username} (+${this.formatTime(sessionTime)})`);

        return sessionTime;
    }

    isInSession(odiscordUserId: string): boolean {
        this.data = this.repository.load();
        return this.data[odiscordUserId]?.sessionStart !== null;
    }

    getTotalTime(odiscordUserId: string): number {
        this.data = this.repository.load();
        const userData = this.data[odiscordUserId];
        
        if (!userData) {
            return 0;
        }

        const baseTime = userData.totalTime;
        const activeTime = userData.sessionStart 
            ? Math.max(0, Date.now() - userData.sessionStart)
            : 0;

        return baseTime + activeTime;
    }

    getRanking(limit: number = 10): UserCallData[] {
        this.data = this.repository.load();
        
        return Object.values(this.data)
            .map(user => this.calculateCurrentTime(user))
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, limit);
    }

    formatTime(ms: number): string {
        return this.timeFormatter.format(ms);
    }

    cleanAllSessions(): void {
        this.data = this.repository.load();
        const now = Date.now();
        let cleaned = 0;
        let newData: CallTimeData = { ...this.data };

        for (const userId in this.data) {
            const user = this.data[userId];
            if (user.sessionStart) {
                const sessionTime = Math.max(0, now - user.sessionStart);
                newData = {
                    ...newData,
                    [userId]: {
                        ...user,
                        totalTime: user.totalTime + sessionTime,
                        sessionStart: null
                    }
                };
                cleaned++;
                this.logger.info(`Sessão finalizada: ${user.username} (+${this.formatTime(sessionTime)})`);
            }
        }

        if (cleaned > 0) {
            this.data = newData;
            this.repository.save(this.data);
            this.logger.info(`${cleaned} sessão(ões) órfã(s) limpas`);
        }
    }

    forceEndSession(odiscordUserId: string): void {
        this.data = this.repository.load();
        const userData = this.data[odiscordUserId];

        if (userData?.sessionStart) {
            this.data = {
                ...this.data,
                [odiscordUserId]: {
                    ...userData,
                    sessionStart: null
                }
            };
            this.repository.save(this.data);
            this.logger.info(`Sessão forçada a encerrar: ${userData.username}`);
        }
    }

    private calculateCurrentTime(user: UserCallData): UserCallData {
        const activeTime = user.sessionStart 
            ? Math.max(0, Date.now() - user.sessionStart)
            : 0;

        return {
            ...user,
            totalTime: user.totalTime + activeTime
        };
    }
}

let instance: CallTimeService | null = null;

export const getCallTimeService = (): CallTimeService => {
    if (!instance) {
        instance = new CallTimeService();
    }
    return instance;
};

export const createCallTimeService = (
    dependencies?: Partial<CallTimeServiceDependencies>
): CallTimeService => {
    return new CallTimeService(dependencies);
};
