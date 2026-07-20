# Resonance

Дейтинг/соц-сеть на основе музыкального вкуса. MVP: онбординг музыкального профиля, лента совпадений, чат, карта мероприятий (без покупки билетов).

## Структура проекта

```
resonance/
  backend/    — Node.js + Express + TypeScript + Prisma + PostgreSQL
  frontend/   — React + Vite + TypeScript + Tailwind CSS
```

## Локальный запуск

### 1. База данных

```bash
docker compose up -d
```

Поднимет PostgreSQL на `localhost:5432` (логин/пароль/база — `resonance`/`resonance`/`resonance`).

### 2. Backend

```bash
cd backend
cp .env.example .env      # проверьте значения, локально можно оставить как есть
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts    # загружает список жанров
npm run dev
```

API поднимется на `http://localhost:4000`. Проверить: `curl http://localhost:4000/health`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

## Деплой на TimeWeb Cloud

У вас уже есть аккаунт, домен и хостинг TimeWeb Cloud — используем **App Platform** (деплой напрямую из GitHub) и **облачную PostgreSQL**.

### Шаг 1 — выложить код на GitHub

```bash
cd resonance
git init
git add .
git commit -m "Initial commit: Resonance MVP scaffold"
git branch -M main
git remote add origin https://github.com/<ваш-логин>/resonance.git
git push -u origin main
```

### Шаг 2 — база данных

В панели TimeWeb Cloud: **Облачные базы данных → Создать кластер → PostgreSQL**. После создания скопируйте строку подключения — она понадобится как `DATABASE_URL`.

### Шаг 3 — backend (App Platform)

1. В панели: **Cloud Apps → Создать приложение → подключить GitHub-репозиторий**
2. Укажите папку `backend` как корень приложения (там лежит `Dockerfile`)
3. Добавьте переменные окружения:
   - `DATABASE_URL` — строка подключения из шага 2
   - `JWT_SECRET` — случайная строка (например, сгенерированная через `openssl rand -hex 32`)
   - `FRONTEND_ORIGIN` — домен вашего фронтенда (например, `https://resonance.ваш-домен.ru`)
   - `PORT` — `4000`
4. Деплой соберёт Docker-образ и запустит `prisma migrate deploy` + сервер автоматически (см. `Dockerfile`)

### Шаг 4 — frontend

1. Второе приложение в Cloud Apps, корень — папка `frontend`
2. Команда сборки: `npm install && npm run build`, папка со статикой: `dist`
3. Переменная окружения: `VITE_API_URL` — адрес задеплоенного backend из шага 3
4. Привяжите ваш домен к этому приложению в настройках Cloud Apps

### После первого деплоя

Зайдите в консоль backend-приложения и выполните разово:
```bash
npx tsx prisma/seed.ts
```
Это загрузит список жанров — без него экран онбординга будет пустым.

## Что дальше (сознательно не реализовано в MVP)

- Авторизация через Spotify/Apple Music
- Групповая покупка билетов и комиссия с них
- Романтический режим дейтинга
- Групповые чаты для компании на мероприятие
- Вебсокеты для чата (сейчас — простой polling раз в 3 секунды, этого достаточно для проверки гипотезы)

См. обсуждение продукта для деталей по каждому пункту.
