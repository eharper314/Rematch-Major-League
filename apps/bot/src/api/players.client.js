const apiUrl = process.env.API_URL;
const apiKey = process.env.BOT_API_KEY;

if (!apiUrl || !apiKey) {
    throw new Error("API_URL and BOT_API_KEY is required.");
}

export async function registerPlayer(discordUserId, inGameName) {
    const response = await fetch(new URL("/players", apiUrl), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            discordUserId,
            inGameName,
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