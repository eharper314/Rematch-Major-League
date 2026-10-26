import {pool} from "../../database.js";

export async function createTeam(staffMember, teamName, teamManager, primaryColor, teamAcronym = "RML", secondaryColor = null) {

    const client = await pool.connect()

    try {
        await client.query(`BEGIN`)

        const findPlayer = `SELECT p.player_id, p.discord_user_id, p.in_game_name, p.ign_updated_at FROM public.players p WHERE discord_user_id = $1`


        const findId = await client.query(findPlayer, [teamManager])

        if (findId.rows[0] === undefined) {
            const error = new Error("Player does not exist.");
            error.code = "NONEXISTENT_PLAYER";
            throw error;
        }

        const managerId = findId.rows[0].player_id

        const findActiveStatus = `SELECT ts.status_id, ts.status_name FROM public.team_statuses ts WHERE status_name = $1`
        const activeStatusFound = await client.query(findActiveStatus, ['ACTIVE'])
        
        if (activeStatusFound.rows[0] === undefined) {
            const error = new Error("ACTIVE status missing from the database.");
            error.code = "MISSING_ACTIVE_STATUS";
            throw error;
        }

        const activeStatus = activeStatusFound.rows[0].status_id

        const teamInsertion = 
        `INSERT INTO public.teams (team_name, team_primary_color, team_acronym, team_secondary_color, team_status_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING team_id, team_acronym, team_name, team_primary_color, team_secondary_color`
        
        const insertTeam = await client.query(teamInsertion, [teamName, primaryColor, teamAcronym, secondaryColor, activeStatus])

        const teamId = insertTeam.rows[0].team_id
        const givenTeamName = insertTeam.rows[0].team_name

        const findManagingType = `SELECT mt.type_id, mt.type_name FROM public.managing_types mt WHERE type_name = $1`
        const managingTypeFound = await client.query(findManagingType, ['MANAGER'])

        if (managingTypeFound.rows[0] === undefined) {
            const error = new Error("MANAGER type missing from the database.");
            error.code = "MISSING_MANAGER_TYPE";
            throw error;
        }

        const manageTypeId = managingTypeFound.rows[0].type_id

        const addManagerEntry = 
        `INSERT INTO public.team_management (player_managing_id, team_managed_id, managing_type_id)
         VALUES ($1, $2, $3)
         RETURNING manage_id, player_managing_id, team_managed_id, managing_type_id`
        
        const managerEntryAdded = await client.query(addManagerEntry, [managerId, teamId, manageTypeId])

        const managerEntered = managerEntryAdded.rows[0].manage_id


        const addAuditLog = 
        `INSERT INTO public.audit_logs (action, actor_discord_user_id, 
        target_type, target_id, changes, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING audit_id, action, actor_discord_user_id, target_id, changes, reason, created_at`

        const finalAuditLog = await client.query(addAuditLog, [
            "team.team_creation",
            staffMember,
            "team",
            teamId,
            {
                "team_id": teamId,
                "team_name": givenTeamName,
                "manage_id": managerEntered,
                "manager_id": managerId
            },
            "Team creation."
        ])

        await client.query(`COMMIT`)
        
        return {
            team: insertTeam.rows[0],
            audit: finalAuditLog.rows[0],
            manager_entry: managerEntryAdded.rows[0],
            manager_discord_user_id: findId.rows[0].discord_user_id
        }
    } catch (error) {
        await client.query(`ROLLBACK`)
        throw error
    } finally {
        client.release()
    }
}

export async function patchRoleForumId(teamId, discordRoleId, forumPostId) {
    const client = await pool.connect();

    try {
        await client.query(`BEGIN`)

        const findTeam = `SELECT team_id, team_discord_role_id, team_thread_id, updated_at FROM teams WHERE team_id = $1 FOR NO KEY UPDATE`

        const targetTeamId = await client.query(findTeam, [teamId])

        if (targetTeamId.rows[0] === undefined) {
            const error = new Error("Team does not exist.");
            error.code = "NONEXISTENT_TEAM";
            throw error;
        }

        const targetTeam = targetTeamId.rows[0].team_id

        const patchTeam = `UPDATE teams SET team_discord_role_id = $2, team_thread_id = $3
        WHERE team_id = $1
        RETURNING team_id, team_discord_role_id, team_thread_id`

        const finalPatchTeam = await client.query(patchTeam, [targetTeam, discordRoleId, forumPostId])

        await client.query(`COMMIT`)
        return {
            team: finalPatchTeam.rows[0].team_id,
            discord: finalPatchTeam.rows[0].team_discord_role_id,
            forum: finalPatchTeam.rows[0].team_thread_id
        }
    } catch (error) {
        await client.query(`ROLLBACK`)
        throw error
    } finally {
        client.release()
    }
}