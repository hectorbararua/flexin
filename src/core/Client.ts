import { 
    ApplicationCommandDataResolvable, 
    Client, 
    Collection, 
    IntentsBitField, 
    Partials 
} from 'discord.js';
import 'dotenv/config';
import { CommandType, ComponentsButton, ComponentsSelect, ComponentsModal } from './types';
import { CommandLoader, EventLoader } from './loaders';

export class ExtendedClient extends Client {
    public commands: Collection<string, CommandType> = new Collection();
    public buttons: ComponentsButton = new Collection();
    public selects: ComponentsSelect = new Collection();
    public modals: ComponentsModal = new Collection();

    private commandLoader: CommandLoader;
    private eventLoader: EventLoader;

    constructor() {
        super({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildVoiceStates,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                Partials.Message,
                Partials.Reaction,
                Partials.ThreadMember,
                Partials.User,
            ],
        });

        this.commandLoader = new CommandLoader();
        this.eventLoader = new EventLoader(this);
        
        this.on('error', () => {});
        this.on('shardError', () => {});
    }

    async start(): Promise<void> {
        await this.loadModules();
        await this.eventLoader.load();
        await this.login(process.env.BOT_TOKEN);
    }

    private async loadModules(): Promise<void> {
        const { commands, slashCommands, buttons, selects, modals } = await this.commandLoader.load();

        this.commands = commands;
        this.buttons = buttons;
        this.selects = selects;
        this.modals = modals;

        this.once('ready', () => this.registerSlashCommands(slashCommands));
    }

    private registerSlashCommands(commands: ApplicationCommandDataResolvable[]): void {
        this.application?.commands.set(commands)
            .then(() => {
                console.log('🆗 Slash commands (/) defined'.green);
            })
            .catch(error => {
                console.log(`❌ Error setting slash commands (/): \n${error}`.red);
            });
    }
}

