-- TapStern — D1 Schema
-- Neue Datenbank:  npx wrangler d1 execute tapstern --remote --file=schema.sql
-- Bestehende DB:   nur den Migrations-Block unten ausführen

CREATE TABLE IF NOT EXISTS businesscards (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  edit_code_hash    TEXT NOT NULL,
  name              TEXT NOT NULL,
  birthday          TEXT DEFAULT '',
  employment_status TEXT DEFAULT 'keiner',
  job_title         TEXT DEFAULT '',
  company_name      TEXT DEFAULT '',
  company_address   TEXT DEFAULT '',
  company_website   TEXT DEFAULT '',
  phone1            TEXT DEFAULT '',
  phone2            TEXT DEFAULT '',
  email1            TEXT DEFAULT '',
  email2            TEXT DEFAULT '',
  bio               TEXT DEFAULT '',
  contacts          TEXT DEFAULT '[]',  -- JSON: [{kind,label,value}, …] — beliebig viele je Art
  linkedin          TEXT DEFAULT '',    -- alt, nur noch als Fallback gelesen
  instagram         TEXT DEFAULT '',    -- alt
  accent_color      TEXT DEFAULT '#968ae0',
  photo_key         TEXT,
  session_token     TEXT,
  session_expires   INTEGER,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS card_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  action     TEXT NOT NULL,   -- view | save | call | mail | web
  source     TEXT DEFAULT '', -- nfc | link | intern
  device     TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_slug_time ON card_events (slug, created_at DESC);

-- ── Migration für eine bestehende Datenbank ───────────────────────────
-- (einzeln ausführen; „duplicate column" heißt: schon vorhanden, überspringen)
-- ALTER TABLE businesscards ADD COLUMN bio          TEXT DEFAULT '';
-- ALTER TABLE businesscards ADD COLUMN linkedin     TEXT DEFAULT '';
-- ALTER TABLE businesscards ADD COLUMN instagram    TEXT DEFAULT '';
-- ALTER TABLE businesscards ADD COLUMN accent_color TEXT DEFAULT '#968ae0';
-- ALTER TABLE businesscards ADD COLUMN contacts     TEXT DEFAULT '[]';

-- Bestehende Karten in die neue Struktur überführen ist nicht nötig:
-- ist contacts leer, liest der Worker phone1/email1/… als Fallback.
