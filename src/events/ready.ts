import { Event } from '../core/types';
import { client } from '..';

export default new Event({
    name: 'ready',
    once: true,
    run() {
        const { commands, buttons, selects, modals } = client;

        console.log('🆗 Bot Online'.green);
        console.log(`📚 Commands: ${commands.size}`.cyan);
        console.log(`📚 Buttons: ${buttons.size}`.cyan);
        console.log(`📚 Selects: ${selects.size}`.cyan);
        console.log(`📚 Modals: ${modals.size}`.cyan);
    },
});

