import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const token = process.env.BOT_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const rest = new REST({ version: '10' }).setToken(token);

async function clearCommands() {
    try {
        console.log('🗑️ Limpando comandos globais...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('✅ Comandos globais limpos!');
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

clearCommands();

