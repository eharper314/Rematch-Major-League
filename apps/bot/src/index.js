import {Client, Events, GatewayIntentBits} from "discord.js";
import {loadCommands} from "./load-commands.js";
import {registerCommands} from "./register-commands.js";


const botToken = process.env.DISCORD_BOT_TOKEN;
const clientID = process.env.DISCORD_CLIENT_ID;
const guildID = process.env.DISCORD_SERVER_ID;

// Handles if the tokens are not loaded correctly
if (!botToken || !clientID || !guildID) {
    throw new Error("The bot token, client ID, or guild ID is missing.");
}

const commands = await loadCommands();

await registerCommands(botToken, clientID, guildID, commands);

const bot = new Client({
    intents: [GatewayIntentBits.Guilds],
});

bot.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});


bot.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Failed to execute /${interaction.commandNmae}: `, error);
    }
});

await bot.login(botToken);