# Supabase Migrationen ausführen

> **Kurzfassung:** Nach `supabase link` funktioniert `db push` automatisch ohne Database-Password!

## Workflow

### 1. Projekt verlinken (einmalig)

```bash
# Kessel (App-Infrastruktur)
npx supabase link --project-ref ufqlocxqizmiaozkashi
```

**Wichtig:** Nach dem Link speichert die CLI die Credentials automatisch.

### 2. Migration erstellen

```bash
# SQL-Skript in migrations-Verzeichnis kopieren
cp scripts/meine-migration.sql supabase/migrations/012_meine_migration.sql
```

**Naming:** `<nummer>_name.sql` (z.B. `012_feature_xyz.sql`)

### 3. Migration ausführen

```bash
# Automatische Authentifizierung über gespeicherten Link!
npx supabase db push --linked --include-all --yes
```

**Kein Database-Password nötig!** Die CLI verwendet die gespeicherten Credentials.

## Häufige Probleme

### Problem: "Migration blockiert durch Fehler"

**Lösung:** Fehlerhafte Migration temporär überspringen:

```bash
mv supabase/migrations/006_fehlgeschlagen.sql supabase/migrations/006_fehlgeschlagen.sql.skip
npx supabase db push --linked --include-all --yes
```

### Problem: "DO $$ BEGIN" Syntax-Fehler

**Lösung:** Migrationen müssen reines SQL sein. Verwende `CREATE TABLE IF NOT EXISTS` statt `DO $$ BEGIN`.

### Problem: "Column does not exist"

**Lösung:** Füge fehlende Spalten mit `ALTER TABLE` hinzu:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meine_tabelle' AND column_name = 'neue_spalte'
  ) THEN
    ALTER TABLE meine_tabelle ADD COLUMN neue_spalte TEXT;
  END IF;
END $$;
```

## CLI Quick Reference

### Projekt wechseln und prüfen

```bash
# Alle verfügbaren Projekte anzeigen (zeigt auch LINKED Status)
npx supabase projects list

# Auf ein Projekt wechseln
npx supabase link --project-ref <REF>
```

### Datenbank inspizieren

```bash
# Tabellen mit Größe und Zeilenanzahl
npx supabase inspect db table-sizes --linked

# Storage Buckets auflisten (erfordert --experimental)
npx supabase storage ls --linked --experimental

# Dateien in einem Bucket auflisten
npx supabase storage ls ss:///bucket-name/ --linked --experimental -r
```

## Alternative: Dashboard (falls CLI nicht funktioniert)

1. Öffne: https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new
2. Kopiere SQL-Skript
3. Führe aus (RUN)

## Migration Best Practices

### Idempotente Migrationen schreiben

```sql
-- ✅ GUT: Idempotent - kann mehrfach ausgeführt werden
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL
);

-- ❌ SCHLECHT: Fehler bei zweiter Ausführung
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);
```

### Spalten sicher hinzufügen

```sql
-- ✅ GUT: Prüft ob Spalte existiert
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Oder mit DO-Block für komplexere Logik
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
```

### RLS-Policies

```sql
-- Immer mit IF NOT EXISTS oder DROP ... IF EXISTS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
```

## Referenzen

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
