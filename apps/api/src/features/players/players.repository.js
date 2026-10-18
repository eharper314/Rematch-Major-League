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

export async function updatePlayer(discordUserId, inGameName) {
    const result = await pool.query(
        `UPDATE public.players
         SET in_game_name = $2, ign_updated_at = CURRENT_TIMESTAMP
         WHERE discord_user_id = $1 AND NOW() >= ign_updated_at + INTERVAL '7 days'
         AND in_game_name <> $2
         RETURNING player_id, discord_user_id, in_game_name, ign_updated_at`,

        [discordUserId, inGameName]
    );

    return result.rows[0];
}

export async function findPlayerByDiscordId(discordUserId) {
    const result = await pool.query(
        `SELECT p.player_id, p.discord_user_id, p.in_game_name, p.ign_updated_at, 
         p.ign_updated_at + INTERVAL '7 days' AS next_allowed_update FROM public.players p
         WHERE p.discord_user_id = $1`,

        [discordUserId]
    );

    return result.rows[0];
}