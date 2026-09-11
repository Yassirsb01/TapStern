-- ══════════════════════════════════════════════════════════════
-- Stempel — zusätzliche Tabellen für die bestehende tapstern-db
-- Eigene Präfixe (stempel_*), keine Kollision mit users/businesscards
-- ══════════════════════════════════════════════════════════════

CREATE TABLE stempel_shops (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  session_token_hash TEXT,
  branche TEXT,
  logo_key TEXT,
  accent_color TEXT DEFAULT '#6366f1',
  reward_threshold INTEGER NOT NULL DEFAULT 10,
  reward_text TEXT NOT NULL DEFAULT 'Ein Gratis-Artikel deiner Wahl',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE stempel_customers (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES stempel_shops(id),
  device_token TEXT UNIQUE NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  wallet_pass_serial TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_stamp_at TEXT
);

CREATE INDEX idx_stempel_customers_shop ON stempel_customers(shop_id);
CREATE INDEX idx_stempel_customers_token ON stempel_customers(device_token);

CREATE TABLE stempel_events (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES stempel_customers(id),
  shop_id TEXT NOT NULL REFERENCES stempel_shops(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_stempel_events_customer ON stempel_events(customer_id);
