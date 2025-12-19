"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const events_1 = require("../../structs/types/events");
exports.default = new events_1.Event({
    name: 'ready',
    once: true,
    run() {
        const { commands, buttons, selects, modals } = __1.client;
        console.log('🆗 Bot Online'.green);
        console.log(`📚 Commands: ${commands.size}`.cyan);
        console.log(`📚 Buttons: ${buttons.size}`.cyan);
        console.log(`📚 Selects: ${selects.size}`.cyan);
        console.log(`📚 Modals: ${modals.size}`.cyan);
    },
});
