import { app } from "./app.js";
import { pool } from "./database.js";

const host = process.env.HOST;
const port = Number(process.env.PORT);

if (!host) {
  throw new Error("HOST is required.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const result = await pool.query(
  "SELECT current_database() AS database_name"
);

console.log(`Connected to database: ${result.rows[0].database_name}`);

app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${port}`);
});