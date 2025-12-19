"use strict";
/**
 * Logger utility for Selfbot operations
 * Provides consistent, colored console output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.Logger = void 0;
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
};
class SelfbotLogger {
    prefix;
    showTimestamp;
    constructor(options = {}) {
        this.prefix = options.prefix || '[Selfbot]';
        this.showTimestamp = options.showTimestamp ?? true;
    }
    getTimestamp() {
        return new Date().toLocaleTimeString('pt-BR');
    }
    formatMessage(level, message) {
        const timestamp = this.showTimestamp ? `[${this.getTimestamp()}]` : '';
        return `${timestamp} ${this.prefix} ${message}`;
    }
    colorize(text, color) {
        return `${Colors[color]}${text}${Colors.reset}`;
    }
    info(message) {
        const formatted = this.formatMessage('info', message);
        console.log(this.colorize(`ℹ️  ${formatted}`, 'blue'));
    }
    success(message) {
        const formatted = this.formatMessage('success', message);
        console.log(this.colorize(`✅ ${formatted}`, 'green'));
    }
    warning(message) {
        const formatted = this.formatMessage('warning', message);
        console.log(this.colorize(`⚠️  ${formatted}`, 'yellow'));
    }
    error(message) {
        const formatted = this.formatMessage('error', message);
        console.error(this.colorize(`❌ ${formatted}`, 'red'));
    }
    debug(message) {
        if (process.env.DEBUG === 'true') {
            const formatted = this.formatMessage('debug', message);
            console.log(this.colorize(`🔍 ${formatted}`, 'dim'));
        }
    }
    highlight(text) {
        return this.colorize(text, 'cyan');
    }
    bold(text) {
        return this.colorize(text, 'bright');
    }
    /**
     * Creates a child logger with a custom prefix
     */
    child(prefix) {
        return new SelfbotLogger({
            prefix: `${this.prefix}${prefix}`,
            showTimestamp: this.showTimestamp
        });
    }
}
// Singleton instance for global use
exports.Logger = new SelfbotLogger();
// Factory for creating custom loggers
const createLogger = (options) => {
    return new SelfbotLogger(options);
};
exports.createLogger = createLogger;
