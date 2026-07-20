import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db";
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

const GENRES = [
  "Инди", "Techno", "House", "Рэп", "Рок", "Поп", "Джаз", "Lo-fi", "Панк",
  "R&B", "Metal", "Классика", "Фолк", "Реггетон", "Drum & Bass", "Соул",
  "Электроника", "Синти-поп", "Шугейз", "Хип-хоп",
];

async function seedGenres() {
  try {
    for (const name of GENRES) {
      await prisma.genre.upsert({ where: { name }, create: { name }, update: {} });
    }
    console.log(`Жанры проверены/загружены: ${GENRES.length}`);
  } catch (err) {
    console.error("Не удалось загрузить жанры при старте:", err);
  }
}

const port = Number(process.env.PORT) || 4000;

seedGenres().then(() => {
  app.listen(port, () => {
    console.log(`Resonance API запущен на порту ${port}`);
  });
});
