import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { profileRouter } from "./routes/profile";
import { matchesRouter } from "./routes/matches";
import { chatRouter } from "./routes/chat";
import { eventsRouter } from "./routes/events";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/events", eventsRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Resonance API запущен на порту ${port}`);
});
