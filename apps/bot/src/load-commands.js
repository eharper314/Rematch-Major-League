import { readdir } from "node:fs/promises";
import { Collection } from "discord.js";

export async function loadCommands() {
  const commands = new Collection();
  const directory = new URL("./commands/", import.meta.url);
  const files = await readdir(directory, { withFileTypes: true });

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".js")) {
      continue;
    }

    const commandUrl = new URL(file.name, directory);
    const command = await import(commandUrl.href);

    if (!command.data || typeof command.execute !== "function") {
      throw new Error(`Invalid command module: ${file.name}`);
    }

    const name = command.data.name;

    if (commands.has(name)) {
      throw new Error(`Duplicate command name: ${name}`);
    }

    commands.set(name, command);
  }

  return commands;
}