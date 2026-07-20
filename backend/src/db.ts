import { PrismaClient } from "@prisma/client";

// Один инстанс PrismaClient на всё приложение — так рекомендует сама Prisma,
// чтобы не открывать лишние соединения с базой при каждом запросе.
export const prisma = new PrismaClient();
