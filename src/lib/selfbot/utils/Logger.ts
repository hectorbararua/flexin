/**
 * Logger utility for Selfbot operations
 * Provides consistent, colored console output
 */

const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
} as const;

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

interface LogOptions {
    prefix?: string;
    showTimestamp?: boolean;
}

class SelfbotLogger {
    private prefix: string;
    private showTimestamp: boolean;

    constructor(options: LogOptions = {}) {
        this.prefix = options.prefix || '[Selfbot]';
        this.showTimestamp = options.showTimestamp ?? true;
    }

    private getTimestamp(): string {
        return new Date().toLocaleTimeString('pt-BR');
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = this.showTimestamp ? `[${this.getTimestamp()}]` : '';
        return `${timestamp} ${this.prefix} ${message}`;
    }

    private colorize(text: string, color: keyof typeof Colors): string {
        return `${Colors[color]}${text}${Colors.reset}`;
    }

    info(message: string): void {
        const formatted = this.formatMessage('info', message);
        console.log(this.colorize(`ℹ️  ${formatted}`, 'blue'));
    }

    success(message: string): void {
        const formatted = this.formatMessage('success', message);
        console.log(this.colorize(`✅ ${formatted}`, 'green'));
    }

    warning(message: string): void {
        const formatted = this.formatMessage('warning', message);
        console.log(this.colorize(`⚠️  ${formatted}`, 'yellow'));
    }

    error(message: string): void {
        const formatted = this.formatMessage('error', message);
        console.error(this.colorize(`❌ ${formatted}`, 'red'));
    }

    debug(message: string): void {
        if (process.env.DEBUG === 'true') {
            const formatted = this.formatMessage('debug', message);
            console.log(this.colorize(`🔍 ${formatted}`, 'dim'));
        }
    }

    highlight(text: string): string {
        return this.colorize(text, 'cyan');
    }

    bold(text: string): string {
        return this.colorize(text, 'bright');
    }

    /**
     * Creates a child logger with a custom prefix
     */
    child(prefix: string): SelfbotLogger {
        return new SelfbotLogger({
            prefix: `${this.prefix}${prefix}`,
            showTimestamp: this.showTimestamp
        });
    }
}

// Singleton instance for global use
export const Logger = new SelfbotLogger();

// Factory for creating custom loggers
export const createLogger = (options: LogOptions): SelfbotLogger => {
    return new SelfbotLogger(options);
};

