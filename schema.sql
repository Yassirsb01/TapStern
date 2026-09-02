CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  verify_token TEXT,
  verify_expires INTEGER,
  reset_token TEXT,
  reset_expires INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS businesscards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  published INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  birthday TEXT DEFAULT '',
  employment_status TEXT DEFAULT 'keiner',
  job_title TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#968ae0',
  contacts TEXT DEFAULT '[]',
  photo_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS card_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  action TEXT NOT NULL,
  source TEXT DEFAULT '',
  device TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_locks (
  key TEXT PRIMARY KEY,
  fails INTEGER DEFAULT 0,
  until INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_events_slug_time ON card_events (slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_user ON businesscards (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
