-- ══════════════════════════════════════════════════════════════
-- Nachrichten an Kunden (Dashboard → „Nachricht an Kunden“)
-- Höchstens eine Nachricht pro Laden und 24 Stunden. Zeiten in Unix-Sekunden.
-- Ausführen: npx wrangler d1 execute tapstern-db --remote --file=migration-messages.sql
-- (Der Worker legt die Tabelle beim ersten Öffnen des Bereichs auch selbst an.)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stempel_messages (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,          -- NULL = bis sie beendet oder ersetzt wird
  ended_at INTEGER             -- gesetzt, wenn der Laden sie vorzeitig beendet
);

CREATE INDEX IF NOT EXISTS idx_stempel_messages_shop ON stempel_messages(shop_id, created_at);
