import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const profileRouter = Router();
profileRouter.use(requireAuth);

// Справочник жанров — используется для сетки выбора на экране онбординга.
profileRouter.get("/genres", async (_req, res) => {
  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  res.json(genres);
});

// Поиск артистов по названию — для автокомплита на экране онбординга.
profileRouter.get("/artists", async (req, res) => {
  const query = String(req.query.q || "");
  const artists = await prisma.artist.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    take: 20,
    orderBy: { name: "asc" },
  });
  res.json(artists);
});

profileRouter.get("/me", async (req, res) => {
  const profile = await prisma.musicProfile.findUnique({
    where: { userId: req.userId! },
    include: {
      genres: { include: { genre: true }, orderBy: { rank: "asc" } },
      artists: { include: { artist: true } },
    },
  });
  res.json(profile);
});

const saveProfileSchema = z.object({
  genreIds: z.array(z.string()).min(1).max(5),
  artistIds: z.array(z.string()).max(15),
  energy: z.number().min(0).max(100),
  mainstream: z.number().min(0).max(100),
  era: z.number().min(0).max(100),
});

// Сохраняет / перезаписывает музыкальный профиль целиком — так проще,
// чем поддерживать частичные обновления ранжированного списка жанров.
profileRouter.put("/me", async (req, res) => {
  const parsed = saveProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { genreIds, artistIds, energy, mainstream, era } = parsed.data;

  const profile = await prisma.musicProfile.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, energy, mainstream, era },
    update: { energy, mainstream, era },
  });

  // Пересобираем список жанров/артистов с нуля
  await prisma.profileGenre.deleteMany({ where: { musicProfileId: profile.id } });
  await prisma.profileArtist.deleteMany({ where: { musicProfileId: profile.id } });

  await prisma.profileGenre.createMany({
    data: genreIds.map((genreId, index) => ({
      musicProfileId: profile.id,
      genreId,
      rank: index + 1, // порядок в массиве = ранг важности
    })),
  });

  await prisma.profileArtist.createMany({
    data: artistIds.map((artistId) => ({ musicProfileId: profile.id, artistId })),
  });

  res.json({ ok: true });
});
