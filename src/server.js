import "dotenv/config";
import express from "express";
import cors from "cors";
import { createAdapterRegistry } from "./adapters/registry.js";
import { createProfileRouter } from "./routes/profile.js";
import { createMatchRouter } from "./routes/match.js";
import { createAuthRouter } from "./routes/auth.js";
import { createCandidatesRouter } from "./routes/candidates.js";
import { createLikesRouter } from "./routes/likes.js";
import { createMatchesRouter } from "./routes/matches.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(new URL("../public", import.meta.url).pathname));

const adapterRegistry = createAdapterRegistry({
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  yandexMusicToken: process.env.YANDEX_MUSIC_TOKEN,
});

app.use("/api", createProfileRouter(adapterRegistry));
app.use("/api", createMatchRouter());
app.use("/api", createAuthRouter());
app.use("/api", createCandidatesRouter());
app.use("/api", createLikesRouter());
app.use("/api", createMatchesRouter());

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MatchTune backend запущен на http://localhost:${PORT}`);
});
