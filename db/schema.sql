-- MatchTune: схема базы данных (MVP)
-- Запуск: psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  age           INTEGER,
  city          TEXT,
  bio           TEXT,
  music_profile JSONB,              -- {genreWeights: {...}, artistWeights: {...}}
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Кэш треков по ссылке на плейлист — чтобы не дёргать Spotify API повторно
-- при каждом заходе одного и того же пользователя
CREATE TABLE IF NOT EXISTS playlist_cache (
  id           SERIAL PRIMARY KEY,
  provider     TEXT NOT NULL,        -- 'spotify' | 'yandex' | 'soundcloud'
  playlist_url TEXT NOT NULL,
  tracks       JSONB NOT NULL,       -- [{title, artist, genres: [...]}]
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, playlist_url)
);

-- Связь пользователя с конкретными треками, которые он исключил из анализа
-- (чекбоксы из интерфейса — сохраняем выбор между сессиями)
CREATE TABLE IF NOT EXISTS user_track_selection (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_key  TEXT NOT NULL,          -- например хэш от title+artist
  is_active  BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, track_key)
);

CREATE TABLE IF NOT EXISTS likes (
  id           SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id          SERIAL PRIMARY KEY,
  user_a_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  match_id   INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON messages (match_id, created_at);

CREATE INDEX IF NOT EXISTS idx_playlist_cache_url ON playlist_cache (playlist_url);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes (to_user_id);
