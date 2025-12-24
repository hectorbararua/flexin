import fs from 'fs';
import path from 'path';
import { Client, ClientEvents } from 'discord.js';
import { EventType } from '../types';

const fileCondition = (fileName: string) => fileName.endsWith('.ts') || fileName.endsWith('.js');

export class EventLoader {
    private eventsPath: string;
    private client: Client;

    constructor(client: Client) {
        this.client = client;
        this.eventsPath = path.join(__dirname, '../../events');
    }

    async load(): Promise<void> {
        if (!fs.existsSync(this.eventsPath)) {
            return;
        }

        const eventFiles = fs.readdirSync(this.eventsPath).filter(fileCondition);

        for (const file of eventFiles) {
            try {
                const filePath = path.join(this.eventsPath, file);
                const eventModule = (await import(filePath))?.default;

                if (!eventModule || typeof eventModule !== 'object' || !('name' in eventModule)) {
                    console.log(`❌ Event file ${file} is missing a valid default export with 'name'. Skipping.`.red);
                    continue;
                }

                const { name, once, run }: EventType<keyof ClientEvents> = eventModule;

                if (name) {
                    if (once) {
                        this.client.once(name, run);
                    } else {
                        this.client.on(name, run);
                    }
                }
            } catch (error) {
                console.log(`❌ Error loading event from ${file}:`.red, error);
            }
        }
    }
}

