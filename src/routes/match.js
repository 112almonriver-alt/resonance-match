import { Router } from "express";
import { calculateCompatibility } from "../matching/similarity.js";

export function createMatchRouter() {
  const router = Router();

  /**
   * POST /api/match
   * body: { profileA: MusicProfile, profileB: MusicProfile }
   * Возвращает скор совместимости и разбор общих жанров/артистов
   */
  router.post("/match", (req, res) => {
    const { profileA, profileB } = req.body;

    if (!profileA || !profileB) {
      return res
        .status(400)
        .json({ error: "profileA и profileB обязательны" });
    }

    const result = calculateCompatibility(profileA, profileB);
    res.json(result);
  });

  return router;
}
