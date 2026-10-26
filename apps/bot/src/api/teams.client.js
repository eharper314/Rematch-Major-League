const apiUrl = process.env.API_URL;
const apiKey = process.env.BOT_API_KEY;

if (!apiUrl || !apiKey) {
    throw new Error("API_URL and BOT_API_KEY is required.");
}

export async function createTeam(staffMember, teamName, teamManager, primaryColor, teamAcronym = "RML", secondaryColor = null) {
    const response = await fetch(new URL("/teams",apiUrl), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            staffMember,
            teamName,
            teamManager,
            primaryColor,
            teamAcronym,
            secondaryColor,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data,
    };
}

export async function patchRoleForumId(teamId, discordRoleId, forumPostId) {
    const response = await fetch(new URL("/teams",apiUrl), {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            teamId,
            discordRoleId,
            forumPostId,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data,
    };
}