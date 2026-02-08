# Theme-Architektur

> **Gültig für:** Alle von der Kessel-Boilerplate abgeleiteten Apps

## Überblick: 3-Ebenen-Architektur

Das Theme-System trennt drei Ebenen klar voneinander:

```
┌───────────────────────────────────────────────────────────┐
│  Ebene 1: App-Level (Admin/Developer)                     │
│  → Brand-Farben, Fonts, Design-System                     │
│  → Gesteuert via NEXT_PUBLIC_DEFAULT_THEME                │
│  → Jede App hat ein eigenes Standard-Theme                │
├───────────────────────────────────────────────────────────┤
│  Ebene 2: User-Global (Jeder User)                        │
│  → Dark/Light/System Mode                                 │
│  → Gespeichert in profiles.color_scheme                   │
│  → Gilt über alle Apps hinweg (KESSEL DB)                 │
├───────────────────────────────────────────────────────────┤
│  Ebene 3: User-Override (Optional, Admin erlaubt/sperrt)  │
│  → User wählt eigenes Brand-Theme (wenn erlaubt)          │
│  → Gespeichert in profiles.selected_theme                 │
│  → Gesteuert via profiles.can_select_theme                │
└───────────────────────────────────────────────────────────┘
```

---

## Was wer steuert

### App-Developer / Admin steuert:

| Eigenschaft | Wo konfiguriert | Beispiel |
|---|---|---|
| Standard-Theme der App | `NEXT_PUBLIC_DEFAULT_THEME` in `.env.local` | `default`, `megasync-brand`, `fsf` |
| Theme-CSS (Farben, Fonts) | Supabase Storage `themes/{tenant}/{id}.css` | OKLCH-Farbwerte, Radii, Shadows |
| Theme-Metadaten | Supabase DB `themes` Tabelle | Name, Beschreibung, dynamische Fonts |
| User darf Theme wählen? | `profiles.can_select_theme` (Boolean) | `true` = User darf, `false` = Admin-Theme |
| Tenant-Isolation | `NEXT_PUBLIC_TENANT_SLUG` in `.env.local` | `megasync`, `companydata` |

### Jeder User steuert selbst:

| Eigenschaft | Wo gespeichert | Werte |
|---|---|---|
| Dark/Light Mode | `profiles.color_scheme` + localStorage | `dark`, `light`, `system` |
| Theme-Auswahl (wenn erlaubt) | `profiles.selected_theme` + localStorage | Theme-ID z.B. `fsf`, `ocean-blue` |

### Was der User NICHT steuern kann:

- Die verfügbaren Themes (nur Admin kann Themes importieren/löschen)
- Ob er ein eigenes Theme wählen darf (`can_select_theme`)
- Das App-Standard-Theme (Environment-Variable)

---

## Datenbank-Schema (KESSEL)

### profiles Tabelle (relevante Spalten)

```sql
-- Migration 024: Theme-Auswahl
selected_theme    TEXT DEFAULT 'default'   -- Vom User gewähltes Theme
can_select_theme  BOOLEAN DEFAULT true     -- Admin steuert Berechtigung

-- Migration 042: Dark/Light Mode
color_scheme      TEXT DEFAULT 'system'    -- dark | light | system
  CHECK (color_scheme IN ('dark', 'light', 'system'))
```

### themes Tabelle

```sql
id            TEXT PRIMARY KEY       -- z.B. 'fsf', 'ocean-blue'
name          TEXT NOT NULL          -- Anzeigename
description   TEXT                   -- Beschreibung
dynamic_fonts TEXT[]                 -- Google Fonts zum Nachladen
is_builtin    BOOLEAN DEFAULT false  -- Builtin-Themes nicht löschbar
```

### Entfernte Spalten

- `theme_preference` (Migration 043) - ersetzt durch `selected_theme`

---

## Storage-Architektur (Multi-Tenant)

```
Supabase Storage: themes/
├── megasync/              ← Tenant "megasync"
│   ├── default.css
│   ├── fsf.css
│   └── ocean-blue.css
├── companydata/           ← Tenant "companydata"
│   └── default.css
└── default.css            ← Ohne Tenant (Legacy/Fallback)
```

Die Tenant-Zuordnung wird über `NEXT_PUBLIC_TENANT_SLUG` gesteuert.
Alle Storage-Operationen verwenden `getTenantStoragePath()` aus `src/lib/utils/tenant.ts`.

---

## CSS-Architektur

Jedes Theme ist eine CSS-Datei mit `data-theme`-Selektoren:

```css
/* Light Mode */
:root[data-theme="fsf"] {
  --background: oklch(1.0000 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  /* ... weitere Tokens */
}

/* Dark Mode */
.dark[data-theme="fsf"] {
  --background: oklch(0.15 0 0);
  --primary: oklch(0.8 0.15 70);
  /* ... weitere Tokens */
}
```

### FOUC-Prevention

Ein Inline-Script im `<head>` von `layout.tsx` setzt `data-theme` sofort:

```javascript
(function() {
  var defaultTheme = 'default'; // aus NEXT_PUBLIC_DEFAULT_THEME
  var theme = localStorage.getItem('tweakcn-theme') || defaultTheme;
  document.documentElement.setAttribute('data-theme', theme);
})();
```

---

## Sync-Flow

### Dark/Light Mode (`useColorSchemeSync`)

```
Login → DB (profiles.color_scheme) → next-themes → localStorage
                    ↑                                    │
                    └────── Bei Wechsel ─────────────────┘
```

### Brand-Theme (`useThemeSyncWithUser`)

```
Login → Prüfe: can_select_theme && selected_theme?
           │
           ├─ Ja → User-Theme anwenden
           │
           └─ Nein → NEXT_PUBLIC_DEFAULT_THEME anwenden

Theme-Wechsel → localStorage + DB (profiles.selected_theme)
                (nur wenn can_select_theme = true)
```

### Fallback-Kette

```
1. Theme-CSS laden → Fehlschlag?
2. → Fallback auf NEXT_PUBLIC_DEFAULT_THEME
3. → Fallback auf "default" (hardcoded)
4. → globals.css Neutral-Werte (letzte Rettung)
```

---

## Theme-Import (TweakCN)

### Flow

1. User exportiert CSS von [tweakcn.com](https://tweakcn.com) (Tailwind v4 Format)
2. Import-Dialog: CSS einfügen + Name vergeben
3. API `/api/themes/import`:
   - Parst `:root` und `.dark` Variablen
   - Konvertiert Font-Namen zu CSS-Variablen
   - Validiert Fonts bei Google Fonts
   - Speichert CSS in Storage (tenant-spezifisch)
   - Speichert Metadaten in DB
4. Theme wird aktiviert (`setTheme` mit `skipValidation`)

### Wichtig:

- Import-Route verwendet `getTenantStoragePath()` für Multi-Tenant
- `upsert: false` verhindert versehentliches Überschreiben
- Rollback bei DB-Fehler: CSS wird wieder aus Storage gelöscht

---

## Dateien-Übersicht

| Datei | Zweck |
|---|---|
| `src/lib/themes/theme-provider.tsx` | Zentraler Theme-Context, CSS-Loading, Fallback |
| `src/hooks/use-theme-sync-with-user.tsx` | Brand-Theme ↔ DB Sync (selected_theme) |
| `src/hooks/use-color-scheme-sync.tsx` | Dark/Light Mode ↔ DB Sync (color_scheme) |
| `src/components/auth/auth-context.tsx` | Lädt User-Profil inkl. Theme-Felder |
| `src/components/providers/ClientProviders.tsx` | Bindet beide Sync-Provider ein |
| `src/app/layout.tsx` | SSR Default-CSS, FOUC-Prevention Script |
| `src/app/api/themes/import/route.ts` | TweakCN CSS Import mit Tenant-Support |
| `src/app/api/themes/list/route.ts` | Theme-Liste aus DB |
| `src/app/api/user/theme/route.ts` | User-Theme + Color-Scheme API |
| `src/lib/themes/storage.ts` | Storage-Service (CRUD für Themes) |
| `src/lib/utils/tenant.ts` | Tenant-Pfad-Utilities |

---

## Environment-Variablen

| Variable | Pflicht | Beispiel | Zweck |
|---|---|---|---|
| `NEXT_PUBLIC_DEFAULT_THEME` | Ja | `default` | Standard-Theme der App |
| `NEXT_PUBLIC_TENANT_SLUG` | Nein | `megasync` | Tenant-Isolation im Storage |
| `NEXT_PUBLIC_SUPABASE_URL` | Ja | `https://...supabase.co` | Supabase-URL für CSS-Loading |

---

## Checkliste: Neues Theme hinzufügen

1. Theme auf [tweakcn.com](https://tweakcn.com) erstellen
2. CSS exportieren (Tailwind v4 Format)
3. In der App: Theme-Manager → "Neues Theme" → CSS einfügen
4. Name vergeben → "Importieren"
5. Optional: Als App-Standard setzen: `NEXT_PUBLIC_DEFAULT_THEME=mein-theme`

## Checkliste: Neue App aufsetzen

1. `NEXT_PUBLIC_DEFAULT_THEME=default` in `.env.local`
2. `NEXT_PUBLIC_TENANT_SLUG=meine-app` in `.env.local`
3. Migrationen ausführen (042, 043 auf KESSEL)
4. Default-Theme CSS in Storage uploaden: `themes/meine-app/default.css`
