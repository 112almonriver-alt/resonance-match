import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { findMatchesForUser, findMatchForUser } from "../db/matches.js";
import { createMessage, findMessagesForMatch } from "../db/messages.js";

export function createMatchesRouter() {
  const router = Router();

  /** GET /api/matches — список мэтчей текущего пользователя */
  router.get("/matches", requireAuth, async (req, res) => {
    try {
      const matches = await findMatchesForUser(req.userId);
      res.json({ matches });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /api/matches/:id/messages — история переписки (только для участников мэтча) */
  router.get("/matches/:id/messages", requireAuth, async (req, res) => {
    try {
      const match = await findMatchForUser(Number(req.params.id), req.userId);
      if (!match) return res.status(404).json({ error: "Мэтч не найден" });

      const messages = await findMessagesForMatch(match.id);
      res.json({ messages });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/matches/:id/messages — отправить сообщение (body: { content }) */
  router.post("/matches/:id/messages", requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "content обязателен" });
    }

    try {
      const match = await findMatchForUser(Number(req.params.id), req.userId);
      if (!match) return res.status(404).json({ error: "Мэтч не найден" });

      const message = await createMessage(match.id, req.userId, content.trim());
      res.status(201).json({ message });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
