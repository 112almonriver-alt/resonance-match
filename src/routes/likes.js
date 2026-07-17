import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createLike, hasReciprocalLike } from "../db/likes.js";
import { createMatch } from "../db/matches.js";

export function createLikesRouter() {
  const router = Router();

  /**
   * POST /api/likes
   * body: { toUserId: number }
   * Ставит лайк; если собеседник уже лайкнул в ответ — создаёт мэтч.
   */
  router.post("/likes", requireAuth, async (req, res) => {
    const { toUserId } = req.body;

    if (!toUserId || toUserId === req.userId) {
      return res.status(400).json({ error: "Некорректный toUserId" });
    }

    try {
      await createLike(req.userId, toUserId);
      const isMutual = await hasReciprocalLike(req.userId, toUserId);

      if (isMutual) {
        const match = await createMatch(req.userId, toUserId);
        return res.json({ liked: true, matched: true, match });
      }

      res.json({ liked: true, matched: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
