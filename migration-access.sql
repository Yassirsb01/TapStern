-- ══════════════════════════════════════════════════════════════
-- Zugang der Stempel-Läden: 24-Stunden-Test, Admin-Freischaltung/-Sperre
-- trial_ends_at: Unix-Sekunden (Ende der Testphase)
-- override: NULL = nach Test/Abo, 'unlocked' = freigeschaltet, 'locked' = gesperrt
-- Ausführen: npx wrangler d1 execute tapstern-db --remote --file=migration-access.sql
-- (Der Worker legt die Tabelle beim ersten Aufruf auch selbst an.)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stempel_shop_access (
  shop_id TEXT PRIMARY KEY,
  trial_ends_at INTEGER NOT NULL,
  override TEXT,
  note TEXT,
  updated_at INTEGER
);

-- Sitzungen des Tapstempel-Admins (stempel-admin.html), getrennt von Laden-Konten und Hub-Admin
CREATE TABLE IF NOT EXISTS stempel_admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
