import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { findUserById } from "../db/users.js";
import { findCandidates } from "../db/candidates.js";
import { getLikedUserIds } from "../db/likes.js";
import { calculateCompatibility } from "../matching/similarity.js";

export function createCandidatesRouter() {
  const router = Router();

  /**
   * GET /api/candidates?city=&minAge=&maxAge=
   * Возвращает кандидатов, отсортированных по убыванию совместимости.
   * Требует, чтобы у текущего пользователя уже был сохранён music_profile
   * (см. POST /api/profile/save).
   */
  router.get("/candidates", requireAuth, async (req, res) => {
    try {
      const me = await findUserById(req.userId);
      if (!me?.music_profile) {
        return res.status(400).json({
          error: "Сначала сохраните музыкальный профиль через POST /api/profile/save",
        });
      }

      const { city, minAge, maxAge } = req.query;
      const alreadyLiked = await getLikedUserIds(req.userId);

      const candidates = await findCandidates(req.userId, {
        city,
        minAge: minAge ? Number(minAge) : undefined,
        maxAge: maxAge ? Number(maxAge) : undefined,
        excludeIds: alreadyLiked,
      });

      const ranked = candidates
        .map((c) => {
          const compatibility = calculateCompatibility(me.music_profile, c.music_profile);
          return {
            id: c.id,
            name: c.name,
            age: c.age,
            city: c.city,
            bio: c.bio,
            ...compatibility,
          };
        })
        .sort((a, b) => b.score - a.score);

      res.json({ candidates: ranked });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
