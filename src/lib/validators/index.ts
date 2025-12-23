export interface ValidationResult {
    readonly isValid: boolean;
    readonly error?: string;
}

export interface IValidator<T> {
    validate(value: T): ValidationResult;
}

const DISCORD_ID_REGEX = /^\d{17,20}$/;
const MIN_TOKEN_LENGTH = 50;
const DISCORD_CDN_PREFIXES = [
    'https://cdn.discordapp.com/',
    'https://media.discordapp.net/'
] as const;

class TokenValidator implements IValidator<string> {
    validate(token: string): ValidationResult {
        if (!token || token.trim().length === 0) {
            return { isValid: false, error: 'Token não pode estar vazia' };
        }

        if (token.length < MIN_TOKEN_LENGTH) {
            return { isValid: false, error: 'Token parece ser inválida (muito curta)' };
        }

        return { isValid: true };
    }
}

class DiscordIdValidator implements IValidator<string> {
    validate(id: string): ValidationResult {
        if (!id || id.trim().length === 0) {
            return { isValid: false, error: 'ID não pode estar vazio' };
        }

        const trimmedId = id.trim();

        if (!DISCORD_ID_REGEX.test(trimmedId)) {
            return { isValid: false, error: 'ID deve conter apenas números (17-20 dígitos)' };
        }

        return { isValid: true };
    }
}

class DiscordCdnValidator implements IValidator<string> {
    validate(url: string): ValidationResult {
        if (!url || url.trim().length === 0) {
            return { isValid: true };
        }

        const isValid = DISCORD_CDN_PREFIXES.some(prefix => url.startsWith(prefix));
        
        if (!isValid) {
            return { isValid: false, error: 'URL deve ser do Discord CDN' };
        }

        return { isValid: true };
    }
}

export class Validators {
    private static readonly tokenValidator = new TokenValidator();
    private static readonly discordIdValidator = new DiscordIdValidator();
    private static readonly discordCdnValidator = new DiscordCdnValidator();

    static validateToken(token: string): ValidationResult {
        return this.tokenValidator.validate(token);
    }

    static validateDiscordId(id: string): ValidationResult {
        return this.discordIdValidator.validate(id);
    }

    static validateDiscordCdn(url: string): ValidationResult {
        return this.discordCdnValidator.validate(url);
    }

    static isValidToken(token: string): boolean {
        return this.validateToken(token).isValid;
    }

    static isValidDiscordId(id: string): boolean {
        return this.validateDiscordId(id).isValid;
    }

    static isDiscordCDN(url: string): boolean {
        return this.validateDiscordCdn(url).isValid;
    }

    static isValidImageUrl(url: string | undefined): boolean {
        if (!url) return true;
        return this.isDiscordCDN(url);
    }

    static sanitizeInput(input: string): string {
        return input.trim();
    }
}

