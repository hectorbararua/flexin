import fs from 'fs';
import path from 'path';

export class JsonRepository<T extends Record<string, unknown>> {
    private filePath: string;

    constructor(fileName: string) {
        this.filePath = path.join(process.cwd(), 'src', 'data', fileName);
    }

    load(): T {
        if (!fs.existsSync(this.filePath)) {
            return {} as T;
        }
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data) as T;
    }

    save(data: T): void {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    get(key: string): T[keyof T] | undefined {
        const data = this.load();
        return data[key as keyof T];
    }

    set(key: string, value: T[keyof T]): void {
        const data = this.load();
        (data as Record<string, unknown>)[key] = value;
        this.save(data);
    }

    delete(key: string): void {
        const data = this.load();
        delete (data as Record<string, unknown>)[key];
        this.save(data);
    }

    getAll(): T {
        return this.load();
    }
}

