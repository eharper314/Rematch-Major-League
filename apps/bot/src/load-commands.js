import { readdir } from "node:fs/promises";
import { Collection } from "discord.js";

async function findCommandFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(entry.name, directory);

    if (entry.isDirectory()) {
      const nestedDirectory = new URL(`${entry.name}/`, directory);
      const nestedFiles = await findCommandFiles(nestedDirectory);

      files.push(...nestedFiles);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    files.push(entryUrl);
  }

  return files;
}

export async function loadCommands() {
  const commands = new Collection();
  const directory = new URL("./commands/", import.meta.url);
  const files = await findCommandFiles(directory);

  for (const file of files) {
    const command = await import(file.href);

    if (!command.data || typeof command.execute !== "function") {
      throw new Error(`Invalid command module: ${file.href}`);
    }

    const name = command.data.name;

    if (typeof name !== "string" || name.length === 0) {
      throw new Error(`Missing command name: ${file.href}`);
    }

    if (commands.has(name)) {
      throw new Error(`Duplicate command name: ${name}`);
    }

    commands.set(name, command);
  }

  return commands;
}