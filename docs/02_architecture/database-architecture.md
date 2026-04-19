# Datenbank-Architektur

## Zwei-Datenbank-Prinzip

| Datenbank    | Zweck                     | Verwaltet von |
| ------------ | ------------------------- | ------------- |
| **Infra-DB** | Boilerplate-Infrastruktur | Kessel        |
| **Dev-DB**   | App-spezifische Daten     | Entwickler    |

```
┌────────────────────────────┐  ┌────────────────────────────┐
│      INFRA-DB (KESSEL)     │  │      DEV-DB (Flexibel)     │
│   ufqlocxqizmiaozkashi     │  │   Supabase / Convex / etc. │
├────────────────────────────┤  ├────────────────────────────┤
│ • Auth / Users             │  │ • Business-Daten           │
│ • Profiles                 │  │ • Kunden, Produkte         │
│ • Themes                   │  │ • App-spezifische Logik    │
│ • Roles / Permissions      │  │                            │
│ • AI-Datasources (Config)  │  │                            │
│ • Vault / Secrets          │  │                            │
└────────────────────────────┘  └────────────────────────────┘
       IMMER dabei                    OPTIONAL
```

## Infra-DB (KESSEL)

**Projekt:** `ufqlocxqizmiaozkashi`

Enthält ausschließlich Boilerplate-Infrastruktur:

| Schema    | Tabellen                                                            |
| --------- | ------------------------------------------------------------------- |
| `public`  | `profiles`, `themes`, `roles`, `role_permissions`, `ai_datasources` |
| `app`     | `tenants`, `user_tenants` (Multi-Tenant mit Aktivierungs-Flag)      |
| `vault`   | `secrets`                                                           |
| `storage` | `themes` Bucket                                                     |

**Regel:** Keine App-spezifischen Business-Daten in der Infra-DB!

## Dev-DB

Bei App-Entwicklung verbindet der Entwickler eine eigene Datenbank:

| Option          | Beschreibung               |
| --------------- | -------------------------- |
| **Supabase**    | Separates Supabase-Projekt |
| **Convex**      | Realtime-Backend           |
| **PlanetScale** | Serverless MySQL           |
| **Neon**        | Serverless Postgres        |
| **Andere**      | Beliebige DB mit API       |

**Konfiguration:** Über "Datenquellen" im Admin-Dashboard (`/app-verwaltung/datenquellen`).

## Environment-Trennung

```bash
# .env.local

# INFRA-DB (immer KESSEL)
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# DEV-DB (optional, app-spezifisch)
DEV_DATABASE_URL=...
DEV_DATABASE_KEY=...
```

## Client-Erstellung

```typescript
// Infra-DB Client (Auth, Themes, Roles)
import { createClient } from "@/utils/supabase/client"
const infraClient = createClient()

// Dev-DB Client (App-Daten) - Beispiel Supabase
import { createClient as createDevClient } from "@supabase/supabase-js"
const devClient = createDevClient(DEV_URL, DEV_KEY)
```

## Wann welche DB?

| Aufgabe                    | Datenbank |
| -------------------------- | --------- |
| Login, Logout, User-Profil | Infra-DB  |
| Theme laden/wechseln       | Infra-DB  |
| Rollen prüfen              | Infra-DB  |
| Secrets abrufen            | Infra-DB  |
| Kunden anlegen             | Dev-DB    |
| Produkte verwalten         | Dev-DB    |
| Bestellungen speichern     | Dev-DB    |
| App-spezifische Queries    | Dev-DB    |

## Multi-Tenant-Architektur

### User-Tenant-Zuordnung (`app.user_tenants`)

Die `app.user_tenants` Tabelle verwaltet die Zuordnung von Usern zu Tenants (Apps):

| Spalte       | Typ         | Beschreibung                                 |
| ------------ | ----------- | -------------------------------------------- |
| `user_id`    | UUID        | Referenz auf `auth.users`                    |
| `tenant_id`  | UUID        | Referenz auf `app.tenants`                   |
| `role`       | TEXT        | Rolle im Tenant: `owner`, `admin`, `member`  |
| `is_active`  | BOOLEAN     | Ob der User in diesem Tenant aktiv ist (neu) |
| `created_at` | TIMESTAMPTZ | Erstellungszeitpunkt                         |

**Primärschlüssel:** `(user_id, tenant_id)` - Ein User kann mehreren Tenants zugeordnet sein.

### User-Tenant-Aktivierung

Das `is_active` Flag ermöglicht es, User pro Tenant zu aktivieren/deaktivieren:

- **`is_active = true`**: User hat Zugriff auf Tenant-Daten (erhält `tenant_id` im JWT)
- **`is_active = false`**: User ist temporär deaktiviert (kein `tenant_id` im JWT, RLS blockiert Zugriff)

**Verwendung:**

```sql
-- User deaktivieren (temporär)
UPDATE app.user_tenants
SET is_active = false
WHERE user_id = '...' AND tenant_id = '...';

-- User reaktivieren
UPDATE app.user_tenants
SET is_active = true
WHERE user_id = '...' AND tenant_id = '...';
```

**Auth Hook Verhalten:**

Der `app.custom_access_token_hook()` berücksichtigt nur aktive Tenant-Zuordnungen:

- Aktiver User (`is_active = true`) → `tenant_id` wird in JWT Claims gesetzt
- Inaktiver User (`is_active = false`) → Kein `tenant_id` im JWT → RLS blockiert Zugriff

**Helper-Funktion:**

```sql
-- Prüft ob User in Tenant aktiv ist
SELECT app.is_user_active_in_tenant(user_uuid, tenant_uuid);
-- Gibt true/false zurück
```

**RLS-Verhalten:**

Alle RLS Policies verwenden `app.current_tenant_id()`, welches den `tenant_id` aus dem JWT liest. Inaktive User haben keinen `tenant_id` Claim und werden daher von allen Tenant-isolierten Policies blockiert.

**Admin-Workflow:**

1. User zu Tenant hinzufügen: `INSERT INTO app.user_tenants (user_id, tenant_id, is_active, role) VALUES (...)`
2. User temporär deaktivieren: `UPDATE app.user_tenants SET is_active = false WHERE ...`
3. User reaktivieren: `UPDATE app.user_tenants SET is_active = true WHERE ...`
4. User komplett entfernen: `DELETE FROM app.user_tenants WHERE ...` (oder `is_active = false` für Audit-Trail)

## Roadmap

Die Datenquellen-Verwaltung wird erweitert um:

- [ ] DB-Verbindungen konfigurieren (nicht nur Tabellen)
- [ ] Verschiedene DB-Typen unterstützen
- [ ] Connection-Tests
- [ ] AI-Tool-Calling für Dev-DBs
