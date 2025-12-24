import { ExtendedClient } from './core/Client';
export * from 'colors';

const client = new ExtendedClient();

client.start();

export { client };
