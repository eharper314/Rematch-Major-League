import {Router} from "express";
import {createPlayer} from "./players.repository.js";
import {authenticateBot} from "../../middleware/authenticate-bot.js";

export const playersRouter = Router();

playersRouter.get("/", (request, response) => {
  response.json({ message: "Player routes are connected." });
});

playersRouter.post("/", authenticateBot, async (request, response) => {
  const {discordUserId, inGameName} = request.body ?? {};

  // Error Handling
  if (typeof discordUserId !== "string") {
    return response.status(400).json({
        error: "Discord user ID must be a string.",
    });
  }

  if (!/^[0-9]{17,20}$/.test(discordUserId)) {
    return response.status(400).json({
        error: "Discord ID is in an invalid format.",
    });
  }

  if (typeof inGameName !== "string") {
    return response.status(400).json({
        error: "In-game name must be a string.",
    });
  }

  const normalizedName = inGameName.trim();

  if (normalizedName.length === 0) {
    return response.status(400).json({
        error: "In-game name cannot be empty.",
    });
  }

  // Writes to the database
  try {
    const player = await createPlayer(discordUserId, inGameName);

    return response.status(201).json({player});
  } catch (error) {

    if (error.code === "23505") {
        return response.status(409).json({
            error: "The Discord account or in-game name is already registered.",
        });
    }

    console.error("Player registration failed: ", error);

    return response.status(500).json({
        error: "Unable to register player.",
    });
  }
});