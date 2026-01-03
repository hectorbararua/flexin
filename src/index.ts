import { ExtendedClient } from './core/Client';
export * from 'colors';

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

const client = new ExtendedClient();

client.start();

export { client };
