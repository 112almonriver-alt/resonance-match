import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { computeMatchScore } from "../utils/matching";

export const matchesRouter = Router();
matchesRouter.use(requireAuth);

async function loadProfileForMatching(userId: string) {
  const profile = await prisma.musicProfile.findUnique({
    where: { userId },
    include: { genres: true, artists: true },
  });
  if (!profile) return null;
  return {
    energy: profile.energy,
    mainstream: profile.mainstream,
    era: profile.era,
    genres: profile.genres.map((g) => ({ genreId: g.genreId, rank: g.rank })),
    artists: profile.artists.map((a) => ({ artistId: a.artistId })),
  };
}

// Лента кандидатов: все пользователи из того же города, которых ещё не лайкали/скипали,
// отсортированные по проценту совпадения (по убыванию).
matchesRouter.get("/feed", async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  const myProfile = await loadProfileForMatching(req.userId!);
  if (!me || !myProfile) {
    return res.status(400).json({ error: "Сначала заполните музыкальный профиль" });
  }

  const alreadySeen = await prisma.like.findMany({
    where: { fromUserId: req.userId! },
    select: { toUserId: true },
  });
  const seenIds = new Set(alreadySeen.map((l) => l.toUserId));

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: req.userId!, notIn: [...seenIds] },
      city: me.city,
      musicProfile: { isNot: null },
    },
    include: {
      musicProfile: { include: { genres: true, artists: true } },
    },
    take: 50,
  });

  const scored = candidates
    .filter((c) => c.musicProfile)
    .map((c) => {
      const theirProfile = {
        energy: c.musicProfile!.energy,
        mainstream: c.musicProfile!.mainstream,
        era: c.musicProfile!.era,
        genres: c.musicProfile!.genres.map((g) => ({ genreId: g.genreId, rank: g.rank })),
        artists: c.musicProfile!.artists.map((a) => ({ artistId: a.artistId })),
      };
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        bio: c.bio,
        photoUrl: c.photoUrl,
        score: computeMatchScore(myProfile, theirProfile),
      };
    })
    .sort((a, b) => b.score - a.score);

  res.json(scored);
});

const swipeSchema = z.object({
  toUserId: z.string(),
  status: z.enum(["LIKE", "PASS"]),
});

// Лайк или пропуск. Если оба пользователя лайкнули друг друга — создаётся мэтч.
matchesRouter.post("/swipe", async (req, res) => {
  const parsed = swipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные" });
  }
  const { toUserId, status } = parsed.data;

  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId: req.userId!, toUserId } },
    create: { fromUserId: req.userId!, toUserId, status },
    update: { status },
  });

  if (status === "PASS") {
    return res.json({ matched: false });
  }

  const reciprocal = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: req.userId! } },
  });

  if (reciprocal?.status !== "LIKE") {
    return res.json({ matched: false });
  }

  // Взаимный лайк — считаем совпадение и создаём мэтч (порядок id стабилен, чтобы избежать дублей)
  const [userAId, userBId] = [req.userId!, toUserId].sort();
  const [profileA, profileB] = await Promise.all([
    loadProfileForMatching(userAId),
    loadProfileForMatching(userBId),
  ]);
  const score = profileA && profileB ? computeMatchScore(profileA, profileB) : 0;

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, score },
    update: {},
  });

  res.json({ matched: true, match });
});

// Список текущих мэтчей пользователя (для экрана "мои чаты")
matchesRouter.get("/", async (req, res) => {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: req.userId! }, { userBId: req.userId! }] },
    include: { userA: true, userB: true },
    orderBy: { createdAt: "desc" },
  });

  const shaped = matches.map((m) => {
    const other = m.userAId === req.userId! ? m.userB : m.userA;
    return {
      matchId: m.id,
      score: m.score,
      otherUser: { id: other.id, name: other.name, photoUrl: other.photoUrl },
    };
  });

  res.json(shaped);
});
