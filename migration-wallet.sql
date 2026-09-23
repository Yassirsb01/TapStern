-- ══════════════════════════════════════════════════════════════
-- Apple Wallet: Geräte, auf denen eine Stempelkarte liegt
-- Das iPhone meldet sich hier automatisch an, sobald die Karte zu Wallet
-- hinzugefügt wird (und ab, wenn sie gelöscht wird). serial = stempel_customers.id
-- Ausführen: npx wrangler d1 execute tapstern-db --remote --file=migration-wallet.sql
-- (Der Worker legt die Tabelle bei der ersten Anmeldung auch selbst an.)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_registrations (
  device_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  serial TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (device_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_wallet_registrations_serial ON wallet_registrations(serial);
