import express from "express";
import {pool} from "./database.js";

const app = express();
const host = process.env.HOST;
const port = Number(process.env.PORT);

if (!host) {
    throw new Error("Host is required.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("There is an issue with the designated port.");
}

app.get("/", (request, response) => {
    response.json({status: "OK"});
});

const result = await pool.query(
    "SELECT current_database() AS database_name"
);

console.log(`Connected to database: ${result.rows[0].database_name}`);

app.listen(port, host, () => {
    console.log(`API listening at http://${host}:${port}`);
});