import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const chatRouter = Router();
chatRouter.use(requireAuth);

async function assertParticipant(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (match.userAId !== userId && match.userBId !== userId) return null;
  return match;
}

// История сообщений в конкретном мэтче.
// Фронтенд опрашивает этот эндпоинт с интервалом (простой polling для MVP,
// вебсокеты — хорошая следующая итерация, когда появится нагрузка).
chatRouter.get("/:matchId/messages", async (req, res) => {
  const match = await assertParticipant(req.params.matchId, req.userId!);
  if (!match) return res.status(404).json({ error: "Мэтч не найден" });

  const messages = await prisma.message.findMany({
    where: { matchId: match.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

const sendSchema = z.object({ text: z.string().min(1).max(2000) });

chatRouter.post("/:matchId/messages", async (req, res) => {
  const match = await assertParticipant(req.params.matchId, req.userId!);
  if (!match) return res.status(404).json({ error: "Мэтч не найден" });

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Пустое сообщение" });

  const message = await prisma.message.create({
    data: { matchId: match.id, senderId: req.userId!, text: parsed.data.text },
  });
  res.status(201).json(message);
});
