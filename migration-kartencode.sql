-- ══════════════════════════════════════════════════════════════
-- Karten-ID für Stempelkarten
-- Kurzer, abtippbarer Code, mit dem ein Kunde seine Karte auf einem
-- neuen Gerät zurückholt. Zeichenvorrat ohne 0/O und 1/I/L.
-- Reihenfolge beachten: Spalte → Bestand füllen → Duplikate auflösen →
-- eindeutigen Index setzen.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE stempel_customers ADD COLUMN card_code TEXT;

-- Bestandskunden bekommen einen zufälligen 8-stelligen Code
UPDATE stempel_customers SET card_code =
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1)
WHERE card_code IS NULL;

-- Sollten dabei zwei gleiche Codes entstanden sein: für die jüngeren neu würfeln.
-- Bei Bedarf mehrfach ausführen, bis 0 Zeilen betroffen sind.
UPDATE stempel_customers SET card_code =
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1) ||
  substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', abs(random()) % 31 + 1, 1)
WHERE id IN (
  SELECT c.id FROM stempel_customers c
  WHERE EXISTS (SELECT 1 FROM stempel_customers o WHERE o.card_code = c.card_code AND o.rowid < c.rowid)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stempel_customers_card_code ON stempel_customers(card_code);
