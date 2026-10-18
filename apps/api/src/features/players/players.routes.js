import {Router} from "express";
import {createPlayer, updatePlayer, findPlayerByDiscordId, staffUpdateIgnOverride} from "./players.repository.js";
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
    const player = await createPlayer(discordUserId, normalizedName);

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

playersRouter.patch("/", authenticateBot, async (request, response) => {
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

  if (normalizedName.length > 32) {
    return response.status(400).json({
      error: "In-game name cannot be greater than 32 characters.",
    });
    
  }
  // Writes to the database
  try {
    let player = await updatePlayer(discordUserId, normalizedName);

    if (player) {
      return response.status(200).json({player});
    }

    player = await findPlayerByDiscordId(discordUserId);
    if (player === undefined) {
      return response.status(404).json({
        error: "There was not a player found with that Discord ID. Please " +
        "register with RML. If you are registered, please contact staff.",
      });
    }

    if (player.in_game_name === normalizedName) {
      return response.status(200).json({player});
    }

    return response.status(409).json({
      error: "You cannot update your IGN yet.",
      code: "IGN_COOLDOWN",
      nextAllowedAt: player.next_allowed_update,
    });

  } catch (error) {

    if (error.code === "23505") {
        return response.status(409).json({
            error: "That in-game name is already registered.",
        });
    }

    console.error("Player IGN update failed: ", error);

    return response.status(500).json({
        error: "Unable to update player.",
    });
  }
});

playersRouter.patch("/adminIgn", authenticateBot, async (request, response) => {
  const {staffMember, targetPlayer, newIgn, reason} = request.body ?? {};

  // Error Handling
  if (typeof staffMember !== "string") {
    return response.status(400).json({
        error: "Staff user ID must be a string.",
    });
  }

  if (!/^[0-9]{17,20}$/.test(staffMember)) {
    return response.status(400).json({
        error: "Staff ID is in an invalid format.",
    });
  }

  if (typeof targetPlayer !== "string") {
      return response.status(400).json({
          error: "Discord user ID must be a string.",
      });
  }

  if (!/^[0-9]{17,20}$/.test(targetPlayer)) {
    return response.status(400).json({
        error: "Discord ID is in an invalid format.",
    });
  }

  if (typeof reason !== "string") {
    return response.status(400).json({
      error: "Reason must be a string.",
    });
  }

  const trimReason = reason.trim();

  if (trimReason.length === 0) {
    return response.status(400).json({
      error: "Reason must not be empty.",
    });
  }

  if (typeof newIgn !== "string") {
    return response.status(400).json({
        error: "In-game name must be a string.",
    });
  }

  const normalizedName = newIgn.trim();


  if (normalizedName.length === 0) {
    return response.status(400).json({
        error: "In-game name cannot be empty.",
    });
  }

  if (normalizedName.length > 32) {
    return response.status(400).json({
      error: "In-game name cannot be longer than 32 characters.",
    });
  }

  // Attempt writing
  try {
    const updateIgn = await staffUpdateIgnOverride(staffMember, targetPlayer, normalizedName, trimReason);

    return response.status(200).json({updateIgn});

  } catch (error) {
    if (error.code === "NONEXISTENT_PLAYER") {
      return response.status(404).json({
        error: error.message
      });
    }

    if (error.code === "23505") {
      return response.status(409).json({
        error: "That IGN is already registered.",
      });
    }

    console.error("Staff override failed: ", error);

    return response.status(500).json({
      error: "Can't update player.",
    });
  }

});