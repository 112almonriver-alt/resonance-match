import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

// Список мероприятий в городе пользователя, ближайшие сначала.
// В MVP покупка билетов не реализована — только внешняя ссылка (externalUrl).
eventsRouter.get("/", async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  const events = await prisma.event.findMany({
    where: me ? { city: me.city } : undefined,
    orderBy: { startsAt: "asc" },
    include: {
      interests: { where: { userId: req.userId! } },
    },
  });

  res.json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      venue: e.venue,
      startsAt: e.startsAt,
      externalUrl: e.externalUrl,
      imageUrl: e.imageUrl,
      myStatus: e.interests[0]?.status ?? null,
    }))
  );
});

const interestSchema = z.object({ status: z.enum(["GOING", "INTERESTED"]) });

eventsRouter.post("/:eventId/interest", async (req, res) => {
  const parsed = interestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Некорректный статус" });

  const interest = await prisma.eventInterest.upsert({
    where: { userId_eventId: { userId: req.userId!, eventId: req.params.eventId } },
    create: { userId: req.userId!, eventId: req.params.eventId, status: parsed.data.status },
    update: { status: parsed.data.status },
  });

  res.json(interest);
});
