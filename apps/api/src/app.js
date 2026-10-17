import express from "express";
import {playersRouter} from "./features/players/players.routes.js";

export const app = express();

app.get("/health", (request, response) => {
  response.json({ status: "OK" });
});

app.use(express.json({limit: "16kb"}));

app.use("/players", playersRouter);