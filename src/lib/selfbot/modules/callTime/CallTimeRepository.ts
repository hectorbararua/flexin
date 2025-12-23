import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CallTimeData, ICallTimeRepository } from './types';
import { Logger } from '../../utils/Logger';

const DATA_DIR = join(process.cwd(), 'src/data');
const CALL_TIME_FILE = join(DATA_DIR, 'callTime.json');

export class CallTimeRepository implements ICallTimeRepository {
    private readonly logger = Logger.child('[CallTimeRepo]');

    constructor() {
        this.ensureDataDir();
    }

    load(): CallTimeData {
        try {
            if (!existsSync(CALL_TIME_FILE)) {
                return {};
            }

            const content = readFileSync(CALL_TIME_FILE, 'utf-8');
            const data = JSON.parse(content) as CallTimeData;
            
            this.logger.info(`Dados carregados: ${Object.keys(data).length} usuários`);
            return data;
        } catch (error) {
            this.logger.error(`Erro ao carregar: ${error}`);
            return {};
        }
    }

    save(data: CallTimeData): void {
        try {
            writeFileSync(CALL_TIME_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.error(`Erro ao salvar: ${error}`);
        }
    }

    private ensureDataDir(): void {
        if (!existsSync(DATA_DIR)) {
            mkdirSync(DATA_DIR, { recursive: true });
        }
    }
}

export const createCallTimeRepository = (): ICallTimeRepository => {
    return new CallTimeRepository();
};

