"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedClient = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
require("dotenv/config");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const infiniteMuteWatcher_1 = require("../lib/infiniteMuteWatcher");
const fileCondition = (fileName) => fileName.endsWith('.ts') || fileName.endsWith('.js');
class ExtendedClient extends discord_js_1.Client {
    commands = new discord_js_1.Collection();
    buttons = new discord_js_1.Collection();
    selects = new discord_js_1.Collection();
    modals = new discord_js_1.Collection();
    constructor() {
        super({
            intents: [
                discord_js_1.IntentsBitField.Flags.Guilds,
                discord_js_1.IntentsBitField.Flags.GuildMembers,
                discord_js_1.IntentsBitField.Flags.GuildVoiceStates,
                discord_js_1.IntentsBitField.Flags.GuildMessages,
            ],
            partials: [
                discord_js_1.Partials.Channel, discord_js_1.Partials.GuildMember, discord_js_1.Partials.GuildScheduledEvent,
                discord_js_1.Partials.Message, discord_js_1.Partials.Reaction, discord_js_1.Partials.ThreadMember, discord_js_1.Partials.User
            ]
        });
    }
    async start() {
        await this.registerModules();
        this.registerEvents();
        (0, infiniteMuteWatcher_1.setupInfiniteMuteWatcher)(this);
        this.login(process.env.BOT_TOKEN);
    }
    registerCommands(commands) {
        this.application?.commands.set(commands)
            .then(() => {
            console.log('🆗 slash commands (/) defined'.green);
        })
            .catch(error => {
            console.log(`❌ an error occured while trying to set the slash commands (/): \n${error}`);
        });
    }
    async registerModules() {
        const slashCommands = new Array();
        const commandsPath = path_1.default.join(__dirname, '..', 'commands');
        const folders = fs_1.default.readdirSync(commandsPath);
        for (const local of folders) {
            const files = fs_1.default.readdirSync(commandsPath + `/${local}/`).filter(fileCondition);
            for (const filename of files) {
                const command = (await Promise.resolve(`${`../commands/${local}/${filename}`}`).then(s => tslib_1.__importStar(require(s))))?.default;
                const { name, buttons, selects, modals } = command;
                if (name) {
                    this.commands.set(name, command);
                    slashCommands.push(command);
                    console.log(`✅ Comando carregado: ${name}`.green);
                    if (buttons)
                        buttons.forEach((run, key) => this.buttons.set(key, run));
                    if (selects)
                        selects.forEach((run, key) => this.selects.set(key, run));
                    if (modals)
                        modals.forEach((run, key) => this.modals.set(key, run));
                }
            }
        }
        this.on('ready', () => this.registerCommands(slashCommands));
    }
    registerEvents() {
        const eventsPath = path_1.default.join(__dirname, '..', 'events');
        fs_1.default.readdirSync(eventsPath).forEach(local => {
            fs_1.default.readdirSync(eventsPath + `/${local}/`).filter(fileCondition)
                .forEach(async (filename) => {
                const eventModule = (await Promise.resolve(`${`../events/${local}/${filename}`}`).then(s => tslib_1.__importStar(require(s))))?.default;
                if (!eventModule || typeof eventModule !== 'object' || !('name' in eventModule)) {
                    console.log(`❌ Event file ${filename} is missing a valid default export with 'name'. Skipping.`.red);
                    return;
                }
                const { name, once, run } = eventModule;
                try {
                    if (name)
                        (once) ? this.once(name, run) : this.on(name, run);
                }
                catch (error) {
                    console.log(`❌ an error occurred on event: ${name} \n${error}`.red);
                }
            });
        });
    }
}
exports.ExtendedClient = ExtendedClient;
