import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks whether the bot is responding.");

export async function execute(interaction) {
    await interaction.reply("Pong!");
}