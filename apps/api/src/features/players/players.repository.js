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

export async function staffUpdateIgnOverride(staffMember, discordUserId, inGameName, reason) {
    const client = await pool.connect()

    try {
        await client.query(`BEGIN`)
        const findPlayer = `SELECT p.player_id, p.discord_user_id, p.in_game_name, p.ign_updated_at FROM players p WHERE discord_user_id = $1 FOR NO KEY UPDATE`


        const findId = await client.query(findPlayer, [discordUserId])

        if (findId.rows[0] === undefined) {
            const error = new Error("Player does not exist.");
            error.code = "NONEXISTENT_PLAYER";
            throw error;
        }

        const targetId = findId.rows[0].player_id
        const oldIgn = findId.rows[0].in_game_name

        const updateIgn = `UPDATE public.players
        SET in_game_name = $2, ign_updated_at = CURRENT_TIMESTAMP
        WHERE discord_user_id = $1
        AND in_game_name <> $2
        RETURNING player_id, discord_user_id, in_game_name, ign_updated_at`

        if (oldIgn === inGameName) {
            await client.query(`ROLLBACK`);
            return {
                player: findId.rows[0],
                audit: null
            };
        }

        const finalUpdateIgn = await client.query(updateIgn, [discordUserId, inGameName])

        const addAuditLog = `INSERT INTO audit_logs (action, actor_discord_user_id, 
        target_type, target_id, changes, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING audit_id, action, actor_discord_user_id, target_id, changes, reason, created_at`

        const finalAuditLog = await client.query(addAuditLog, [
            "player.ign_override",
            staffMember,
            "player",
            targetId,
            {
                "before": oldIgn,
                "after": inGameName,
            },
            reason
        ])

        await client.query(`COMMIT`)
        return{
            player: finalUpdateIgn.rows[0],
            audit: finalAuditLog.rows[0]
        }
    } catch  (error) {
        await client.query(`ROLLBACK`)
        throw error
    } finally {
        client.release()
    }
}