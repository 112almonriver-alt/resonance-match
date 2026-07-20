// Наполняет базу стартовым списком жанров, чтобы экран онбординга
// сразу было чем показать. Запуск: npx tsx prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GENRES = [
  "Инди", "Techno", "House", "Рэп", "Рок", "Поп", "Джаз", "Lo-fi", "Панк",
  "R&B", "Metal", "Классика", "Фолк", "Реггетон", "Drum & Bass", "Соул",
  "Электроника", "Синти-поп", "Шугейз", "Хип-хоп",
];

async function main() {
  for (const name of GENRES) {
    await prisma.genre.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`Загружено жанров: ${GENRES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
