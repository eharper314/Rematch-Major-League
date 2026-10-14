import { REST, Routes } from "discord.js";

export async function registerCommands(token, clientId, guildId, commands) {
  const rest = new REST({ version: "10" }).setToken(token);
  const definitions = commands.map((command) => command.data.toJSON());

  await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: definitions },
  );

  console.log(`Registered ${definitions.length} test server commands.`);
}