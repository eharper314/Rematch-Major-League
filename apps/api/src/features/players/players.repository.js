import {pool} from "../../database.js";

export async function createPlayer(discordUserId, inGameName) {
    const result = await pool.query(
        `INSERT INTO public.players (discord_user_id, in_game_name)
         VALUES ($1, $2)
         RETURNING player_id, discord_user_id, in_game_name, registered_at, ign_updated_at`,

        [discordUserId, inGameName]
    );

    return result.rows[0];
}

