import {timingSafeEqual} from "node:crypto";

const apiKey = process.env.BOT_API_KEY;

if (!apiKey || !/^[a-f0-9]{64}$/.test(apiKey)) {
    throw new Error("BOT_API_KEY is missing or incorrectly formatted.");    
}

const expectedKey = Buffer.from(apiKey, "hex");

export function authenticateBot(request, response, next) {
    const authorization = request.get("Authorization");
    const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization ?? "");

    if (!match) {
        return response.status(401).json({
            error: "Invalid or missing API credential.",
        });
    }


    const suppliedKey = Buffer.from(match[1], "hex");

    if (!timingSafeEqual(suppliedKey, expectedKey)) {
        return response.status(401).json({
            error: "Invalid or missing API credential.",
        });
    }

    next();
}

