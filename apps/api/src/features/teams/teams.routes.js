import {Router} from "express";
import {authenticateBot} from "../../middleware/authenticate-bot.js";
import {createTeam} from "./teams.repository.js";

export const teamsRouter = Router();

teamsRouter.get("/", (request, response) => {
    response.json({message: "Teams endpoints are connected."});
});

teamsRouter.post("/", authenticateBot, async (request, response) => {
    const {
        staffMember,
        teamName, 
        teamManager,
        primaryColor,
        teamAcronym = "RML",
        secondaryColor = null } = request.body ?? {};

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

    if (typeof teamManager !== "string") {
        return response.status(400).json({
            error: "Discord user ID must be a string.",
        });
    }

    if (!/^[0-9]{17,20}$/.test(teamManager)) {
        return response.status(400).json({
            error: "Discord ID is in an invalid format.",
        });
    }

    if (typeof teamName !== "string") {
        return response.status(400).json({
            error: "Team name must be a string.",
        });
    }

    const normalizedTeamName = teamName.trim();

    if (normalizedTeamName.length > 64 || normalizedTeamName.length === 0) {
        return response.status(400).json({
            error: "Team name must be 1-64 characters long.",
        });
    }

    if (typeof teamAcronym !== "string") {
        return response.status(400).json({
            error: "Team acronym must be a string.",
        });
    }

    const normalizedTeamAcronym = teamAcronym.trim();

    if (normalizedTeamAcronym.length > 5 || normalizedTeamAcronym.length === 0) {
        return response.status(400).json({
            error: "Team acronym must be 1-5 characters long.",
        });
    }

    if (typeof primaryColor !== "string") {
        return response.status(400).json({
            error: "Team primary color must be a string.",
        });
    }

    let normalizedPrimaryColor = primaryColor.trim().toUpperCase();

    if(!/^#[0-9A-F]{6}$/.test(normalizedPrimaryColor)) {
        return response.status(400).json({
            error: "Primary color must be in #FFFFFF format.",
        });
    }

    if (normalizedPrimaryColor === "#000000") {
        normalizedPrimaryColor = "#000001";
    }


    let normalizedSecondaryColor = null;

    if (secondaryColor !== null) {

        if (typeof secondaryColor !== "string") {
            return response.status(400).json({
                error: "Secondary color must be a string.",
            });
        }
        
        normalizedSecondaryColor = secondaryColor.trim().toUpperCase();

        if (!/^#[0-9A-F]{6}$/.test(normalizedSecondaryColor)) {
            return response.status(400).json({
                error: "Secondary color must be in #FFFFFF format.",
            });
        }

        if (normalizedSecondaryColor === "#000000") {
            normalizedSecondaryColor = "#000001";
        }

    }

    // Try writing to the database
    try {
        const commitTeam = await createTeam(staffMember, normalizedTeamName, teamManager, normalizedPrimaryColor, normalizedTeamAcronym, normalizedSecondaryColor);
        return response.status(201).json(commitTeam);
    } catch (error) {
        if (error.code === "NONEXISTENT_PLAYER") {
            return response.status(404).json({
                error: error.message
            });
        }

        if (error.code === "23505" && error.constraint === "team_name_case_insensitive_unique") {
            return response.status(409).json({
                error: "That team name is already registered.",
            });
        }

        console.error("Team creation failed: ", error);

        return response.status(500).json({
            error: "Can't create team.",
        });
    }
});

