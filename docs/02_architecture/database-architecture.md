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
| `app`     | `tenants`, `user_tenants` (Multi-Tenant)                            |
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

## Roadmap

Die Datenquellen-Verwaltung wird erweitert um:

- [ ] DB-Verbindungen konfigurieren (nicht nur Tabellen)
- [ ] Verschiedene DB-Typen unterstützen
- [ ] Connection-Tests
- [ ] AI-Tool-Calling für Dev-DBs
