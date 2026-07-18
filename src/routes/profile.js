import { Router } from "express";
import { getCachedTracks, saveTracksToCache } from "../db/playlistCache.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { saveMusicProfile } from "../db/users.js";
import { enrichTracksWithGenres } from "../enrichment/lastfm.js";

export function createProfileRouter(adapterRegistry) {
  const router = Router();

  router.post("/profile", async (req, res) => {
    const { playlistUrl } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({ error: "playlistUrl обязателен" });
    }

    try {
      const adapter = adapterRegistry.findAdapterForUrl(playlistUrl);
      let tracks = await tryGetFromCache(adapter.providerName, playlistUrl);
      let fromCache = Boolean(tracks);

      if (!tracks) {
        tracks = await adapter.getTracksByPlaylistUrl(playlistUrl);

        const needsEnrichment = tracks.some((t) => !t.genres || t.genres.length === 0);
        if (needsEnrichment && process.env.LASTFM_API_KEY) {
          tracks = await enrichTracksWithGenres(tracks, process.env.LASTFM_API_KEY);
        }

        await trySaveToCache(adapter.providerName, playlistUrl, tracks);
      }

      res.json({
        provider: adapter.providerName,
        fromCache,
        trackCount: tracks.length,
        tracks: tracks.map((t, i) => ({
          id: i,
          title: t.title,
          artist: t.artist,
          genres: t.genres ?? [],
        })),
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/profile/manual", async (req, res) => {
    const { tracksText } = req.body;

    if (!tracksText || !tracksText.trim()) {
      return res.status(400).json({ error: "tracksText обязателен" });
    }

    try {
      let tracks = parseTracksText(tracksText);

      if (tracks.length === 0) {
        return res.status(400).json({ error: "Не удалось распознать ни одного трека в тексте" });
      }

      if (process.env.LASTFM_API_KEY) {
        tracks = await enrichTracksWithGenres(tracks, process.env.LASTFM_API_KEY);
      }

      res.json({
        provider: "manual",
        fromCache: false,
        trackCount: tracks.length,
        tracks: tracks.map((t, i) => ({
          id: i,
          title: t.title,
          artist: t.artist,
          genres: t.genres ?? [],
        })),
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/profile/save", requireAuth, async (req, res) => {
    const { genreWeights, artistWeights } = req.body;

    if (!genreWeights) {
      return res.status(400).json({ error: "genreWeights обязателен" });
    }

    try {
      await saveMusicProfile(req.userId, { genreWeights, artistWeights: artistWeights ?? {} });
      res.json({ saved: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

function parseTracksText(text) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(/\s+[-—–]\s+/);
    if (parts.length >= 2) {
      return { title: parts.slice(1).join(" - ").trim(), artist: parts[0].trim(), genres: [] };
    }
    return { title: line, artist: "Неизвестный артист", genres: [] };
  });
}

async function tryGetFromCache(provider, playlistUrl) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await getCachedTracks(provider, playlistUrl);
  } catch (err) {
    console.warn("Кэш плейлистов недоступен, идём напрямую к провайдеру:", err.message);
    return null;
  }
}

async function trySaveToCache(provider, playlistUrl, tracks) {
  if (!process.env.DATABASE_URL) return;
  try {
    await saveTracksToCache(provider, playlistUrl, tracks);
  } catch (err) {
    console.warn("Не удалось сохранить кэш плейлиста:", err.message);
  }
}
