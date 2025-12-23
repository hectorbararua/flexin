export interface ITimeFormatter {
    format(ms: number): string;
}

export class TimeFormatter implements ITimeFormatter {
    format(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}min`;
        }
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}min`;
        }
        
        if (minutes > 0) {
            return `${minutes}min ${seconds % 60}s`;
        }
        
        return `${seconds}s`;
    }
}

export const createTimeFormatter = (): ITimeFormatter => {
    return new TimeFormatter();
};

