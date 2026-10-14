import {Client, Events, GatewayIntentBits} from "discord.js";

const botToken = process.env.DISCORD_BOT_TOKEN;

if (!botToken) {
    throw new Error("The bot token is missing.");
}

const bot = new Client({
    intents: [GatewayIntentBits.Guilds],
});

bot.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});

await bot.login(botToken);