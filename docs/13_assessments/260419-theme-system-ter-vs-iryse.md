# Theme System Assessment: TER vs. iryse

**Urspruenglich erstellt:** 2026-04-15 fuer Projekt TER  
**Portiert nach kessel-boilerplate:** 2026-04-19 — 1:1 Uebernahme, keine inhaltlichen Aenderungen  
**Zweck:** Tiefgehender Vergleich des Theme-Managements und Design-Systems zwischen TER und iryse, um die notwendigen Aenderungen fuer eine funktionierende, persistente, Admin-gesteuerte Loesung zu identifizieren.

## Gueltigkeit fuer kessel-boilerplate

Die in diesem Dokument beschriebene **TER-Architektur entspricht 1:1 der aktuellen
kessel-boilerplate-Architektur** — beide Projekte basieren auf derselben Boilerplate-
Grundlage. Alle Dateipfade, Datei-Namen und Symptome aus dem "TER (aktuell)"-Teil
sind daher direkt auf kessel-boilerplate uebertragbar:

- `src/lib/themes/theme-provider.tsx` — identisch vorhanden
- `src/lib/themes/storage.ts` — identisch vorhanden
- `src/app/(shell)/app-verwaltung/design-system/page.tsx` — identisch vorhanden (1604 LOC)
- `src/app/(shell)/app-verwaltung/theme-manager/page.tsx` — identisch vorhanden
- `src/hooks/theme-editor-context.tsx` — identisch vorhanden
- `src/app/(shell)/benutzer-menue/theme/page.tsx` — identisch vorhanden (wird entfernt)

Die **iryse-Zielarchitektur** ist unter `B:/DEV/iryse/src/lib/themes/` verifiziert
vorhanden und wird fuer die Portierung als Referenz herangezogen.

Der Umsetzungsplan fuer kessel-boilerplate liegt in
`docs/12_plans/260419-theme-persistenz-iryse-portierung.md`.

---

## 1. Executive Summary

Das iryse-Projekt hat einen fundamentalen Architekturwechsel durchlaufen: von einem **per-User Theme** (localStorage-basiert, mit optionalem DB-Sync) zu einem **globalen, Admin-gesteuerten Theme** (Server-Snapshot-basiert, mit Realtime-Broadcast). TER steht noch auf der alten Boilerplate-Architektur und hat saemtliche bekannten Schwaechen.

**Kern-Erkenntnis:** Es reicht nicht, einzelne Dateien zu patchen. Die Aenderung betrifft 8+ Dateien und verschiebt die Autoritaet von "localStorage ist Source of Truth" zu "Server-Snapshot ist Source of Truth".

---

## 2. Architektur-Vergleich auf einen Blick

| Aspekt               | TER (aktuell)                                       | iryse (Ziel)                                              |
| -------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| **Source of Truth**  | localStorage (`tweakcn-theme`, `next-themes-theme`) | Server-Snapshot (`getEffectiveThemeSnapshot()`)           |
| **Theme-Auswahl**    | Jeder User mit `canSelectTheme`                     | Nur Admins                                                |
| **Color Scheme**     | Per-User (jeder kann dark/light waehlen)            | Global, Admin-gesteuert                                   |
| **Sync-Richtung**    | Bidirektional: DB <-> localStorage                  | Unidirektional: Server -> Client                          |
| **Theme Provider**   | React Context + useState + localStorage             | External Store (`useSyncExternalStore`) + Server-Snapshot |
| **CSS-Loading**      | Client-seitig via `<link>` Tags + Supabase URL      | Server-seitig resolved + `<style>` Injection              |
| **FOUC Prevention**  | localStorage lesen im Inline-Script                 | Server-gerendertes `data-theme` Attribut                  |
| **Sync-Hooks**       | Aktive bidirektionale Sync-Logik (116 + 129 Zeilen) | Leere Stubs (je ~20 Zeilen)                               |
| **Realtime-Updates** | Keine                                               | `emitRealtimeEvent` nach Theme-Aenderungen                |
| **Cache-Strategie**  | Session-basierter Cache-Buster fuer CSS             | Multi-Layer: Snapshot-Cache, CSS-Cache, Bootstrap-Cache   |
| **Snapshot**         | Nicht vorhanden                                     | Server-seitig generiert mit `getEffectiveThemeSnapshot()` |

---

## 3. Detaillierte Schwaechen in TER

### 3.1 Source-of-Truth-Problem (KRITISCH)

**Datei:** `src/lib/themes/theme-provider.tsx`

TER verwendet `localStorage` als primaere Source of Truth:

```typescript
// TER: theme-provider.tsx Zeile 291
const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme
setThemeState(savedThemeId)
```

**Problem:** Jeder User hat sein eigenes Theme in localStorage. Es gibt keine zentrale Autoritaet. Wenn ein Admin das Theme aendert, sehen andere User die Aenderung erst nach manuellem Neuladen und nur wenn sie `canSelectTheme=false` haben.

**iryse-Loesung:** Server-Snapshot ist die einzige Autoritaet. Der `ThemeProvider` akzeptiert einen `initialSnapshot` und nutzt einen externen Store (`useSyncExternalStore`) statt useState + localStorage.

### 3.2 Bidirektionaler Sync erzeugt Race Conditions (KRITISCH)

**Dateien:**

- `src/hooks/use-color-scheme-sync.tsx` (116 Zeilen aktive Logik)
- `src/hooks/use-theme-sync-with-user.tsx` (129 Zeilen aktive Logik)

TER synchronisiert bidirektional:

1. Bei Login: DB -> localStorage (Color Scheme + Theme)
2. Bei Aenderung: localStorage -> DB

**Probleme:**

- Race Condition bei gleichzeitigem Login + Theme-Aenderung
- `useRef`-basiertes Tracking (`initialSyncDone`, `lastUserId`, `lastColorScheme`) ist fragil
- `useNextTheme()` kann beim Mount `undefined` sein -> unvorhersehbares Verhalten
- Color Scheme wird per-User gespeichert -> jeder User hat potenziell ein anderes

**iryse-Loesung:** Beide Hooks sind leere Stubs. Es gibt keinen bidirektionalen Sync mehr. Das Server-Snapshot liefert bereits das korrekte Theme und Color Scheme. Admins aendern via PUT-Route, die auf alle Admins synchronisiert.

### 3.3 Kein Server-Snapshot (KRITISCH)

**TER fehlt komplett:**

- `src/lib/themes/snapshot.ts`
- `src/lib/themes/theme-store.ts`
- `src/lib/themes/css.ts`
- `src/lib/themes/apply-active-theme-css.ts`
- `src/lib/themes/theme-save-merge.ts`
- `src/lib/themes/types.ts`
- `src/lib/themes/constants.ts`

In TER existieren nur 3 Dateien unter `src/lib/themes/`:

- `index.ts` (Re-Export)
- `registry-bootstrap.ts` (Default-Theme sicherstellen)
- `storage.ts` (Supabase-Client direkt im Browser)

In iryse existieren 11 Dateien mit klar getrennter Verantwortung.

### 3.4 Client-seitiges CSS-Loading via direktem Supabase-Client (HOCH)

**Datei:** `src/lib/themes/storage.ts`

```typescript
// TER: storage.ts Zeile 93
const supabase = createClient()
const { data, error } = await supabase.storage.from("themes").download(storagePath)
```

TER nutzt den Supabase Browser-Client direkt, um Theme-CSS zu laden. Das widerspricht der Clerk-Migration-Architektur (kein Supabase-Client im Browser) und ist langsamer als ein API-gesteuerter Ansatz.

**iryse-Loesung:** CSS wird ausschliesslich ueber API-Routen geladen (`/api/themes/css`), mit serverseitigem Caching und fallback-Logik in `css.ts`.

### 3.5 Theme-CSS als `<link>` statt `<style>` (MITTEL)

**Datei:** `src/lib/themes/theme-provider.tsx` Zeile 112-161

TER laed Theme-CSS als `<link rel="stylesheet">` mit Cache-Buster:

```typescript
link.href = `${supabaseUrl}/storage/v1/object/public/themes/${storagePath}${cacheBuster}`
```

**Probleme:**

- Zusaetzlicher HTTP-Request pro Theme-Wechsel
- Alte `<link>` Tags bleiben im DOM (CSS-Spezifitaet kann kollidieren)
- Cache-Buster-Logik ist fragil (Session-basiert vs. forceReload)

**iryse-Loesung:** Ein einziger `<style id="active-theme-css">` Tag wird serverseitig injiziert und bei Wechsel ueberschrieben (`applyActiveThemeCss`).

### 3.6 FOUC-Prevention liest localStorage (MITTEL)

**Datei:** `src/app/layout.tsx` Zeile 147-156

```javascript
// TER: Inline-Script
var theme = localStorage.getItem("tweakcn-theme") || defaultTheme
document.documentElement.setAttribute("data-theme", theme)
```

**Problem:** Liest das Theme aus localStorage, nicht vom Server. Bei einem global-Admin-Theme ist der localStorage-Wert eines normalen Users irrelevant und potenziell falsch.

**iryse-Loesung:** Der Server rendert `data-theme={activeThemeId}` direkt auf `<html>`. Das Inline-Script liest nur das bereits gesetzte Server-Attribut als Fallback:

```javascript
// iryse: Inline-Script
var serverTheme = document.documentElement.getAttribute("data-theme") || "${activeThemeId}"
```

### 3.7 Fehlende Admin-Synchronisation bei PUT (HOCH)

**Datei:** `src/app/api/user/theme/route.ts`

TER speichert Theme-Aenderungen nur fuer den aktuellen User:

```typescript
// TER: route.ts Zeile 138
const success = await getCoreStore().updateUserThemeState(userId, { ... })
```

**iryse-Loesung:** Die PUT-Route synchronisiert Aenderungen auf ALLE Admin-Profile:

```typescript
// iryse: route.ts Zeile 110-112
await Promise.all(
  adminUsers.map((admin) => coreStore.updateUserThemeState(admin.clerkUserId, syncPayload))
)
```

Plus Realtime-Event fuer sofortige Client-Updates:

```typescript
emitRealtimeEvent(THEME_SNAPSHOT_TOPIC, "theme-updated", { ... })
```

### 3.8 User-Menu Theme-Seite existiert (ENTFERNEN)

**Datei:** `src/app/(shell)/benutzer-menue/theme/page.tsx` (857+ Zeilen)

In TER existiert eine vollstaendige Theme-Personalisierungsseite im Benutzer-Menue:

- Theme-Auswahl
- Dark/Light Mode Toggle
- Theme-Import (TweakCN)
- Theme loeschen

**Ziel:** Diese Seite soll komplett entfernt werden. Theme-Aenderungen gehoeren ausschliesslich in `/app-verwaltung/design-system` und `/app-verwaltung/theme-manager`.

### 3.9 Fehlende GET-Snapshot-Route (HOCH)

**Datei:** `src/app/api/user/theme/route.ts`

TER's GET-Route gibt Rohdaten zurueck:

```typescript
return NextResponse.json({
  theme: themeState.theme,
  colorScheme: themeState.colorScheme,
  canSelectTheme: themeState.canSelectTheme || themeState.isAdmin,
  ...
})
```

**iryse-Loesung:** GET gibt einen vollstaendigen Snapshot zurueck (inkl. CSS, Themes-Liste, Corner-Style):

```typescript
const snapshot = await getEffectiveThemeSnapshot()
return NextResponse.json(snapshot, { headers: { "Cache-Control": "..." } })
```

---

## 4. Vollstaendige Aenderungsliste

### Phase 1: Neue Dateien erstellen

| Datei                                      | Quelle            | Zweck                                                                          |
| ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| `src/lib/themes/types.ts`                  | iryse             | TypeScript Interfaces: ThemeMeta, ThemeSnapshot, ThemeColorScheme, CornerStyle |
| `src/lib/themes/constants.ts`              | iryse             | DEFAULT_THEME_ID, THEME_SNAPSHOT_TOPIC                                         |
| `src/lib/themes/snapshot.ts`               | iryse (angepasst) | `getEffectiveThemeSnapshot()` — Server-seitig, liest Admin-Theme               |
| `src/lib/themes/theme-store.ts`            | iryse             | External Store mit `useSyncExternalStore`, kein localStorage                   |
| `src/lib/themes/css.ts`                    | iryse             | CSS-Parsing, `resolveThemeCss`, `extractCornerStyleFromCss`                    |
| `src/lib/themes/apply-active-theme-css.ts` | iryse             | DOM-Injection: `<style id="active-theme-css">`                                 |
| `src/lib/themes/theme-save-merge.ts`       | iryse             | Pure Utilities fuer Theme-Speichern                                            |

### Phase 2: Bestehende Dateien umschreiben

| Datei                                        | Aenderung                                                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`src/lib/themes/theme-provider.tsx`**      | Komplett umschreiben: useState/localStorage -> useSyncExternalStore + initialSnapshot. setTheme/setColorMode werden async und gehen ueber API. Kein localStorage mehr. |
| **`src/lib/themes/storage.ts`**              | Komplett umschreiben: Kein Supabase-Client mehr. API-basiert mit Caching. Neue Funktionen: `fetchThemeSnapshot`, `fetchThemeCSS`, `updateEffectiveThemeSelection`.     |
| **`src/lib/themes/index.ts`**                | Anpassen: Neue Exports (ThemeSnapshot, CornerStyle, etc.)                                                                                                              |
| **`src/hooks/use-color-scheme-sync.tsx`**    | Auf leeren Stub reduzieren (wie iryse)                                                                                                                                 |
| **`src/hooks/use-theme-sync-with-user.tsx`** | Auf leeren Stub reduzieren (wie iryse)                                                                                                                                 |
| **`src/app/api/user/theme/route.ts`**        | GET: Snapshot zurueckgeben. PUT: Nur Admins, Sync auf alle Admins, Realtime-Event.                                                                                     |
| **`src/app/layout.tsx`**                     | Server-seitigen Snapshot laden, `data-theme` auf `<html>` setzen, CSS als `<style>` injizieren, FOUC-Script anpassen.                                                  |

### Phase 3: UI-Aenderungen

| Datei                                                       | Aenderung                                              |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| **`src/app/(shell)/benutzer-menue/theme/page.tsx`**         | Komplett entfernen                                     |
| **`src/app/(shell)/benutzer-menue/theme/`**                 | Verzeichnis loeschen                                   |
| **Navigation-Config**                                       | Theme-Eintrag aus Benutzer-Menue entfernen             |
| **`src/app/(shell)/app-verwaltung/design-system/page.tsx`** | Pruefen: Dark/Light Toggle muss Admin-global speichern |
| **`src/app/(shell)/app-verwaltung/theme-manager/page.tsx`** | Pruefen: Theme-Auswahl muss ueber neuen Store laufen   |

### Phase 4: API-Aenderungen

| Route                     | Aenderung                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| **`/api/themes/css`**     | Neue Route erstellen (Theme-CSS ueber API statt direkt aus Storage) |
| **`/api/user/theme` GET** | Auf Snapshot-basiert umstellen                                      |
| **`/api/user/theme` PUT** | Admin-only + Multi-Admin-Sync + Realtime-Event                      |

---

## 5. Risiken und Fallstricke

### 5.1 SpacetimeDB Kompatibilitaet

TER und iryse nutzen beide SpacetimeDB (Boilerplate Core). Die Snapshot-Logik ruft `getCoreStore().listUsers()` und `getUserThemeState()` auf. Diese Funktionen muessen in TER's Core Store vorhanden sein (sind sie wahrscheinlich, da gleicher Boilerplate).

### 5.2 Realtime-Events

iryse nutzt `emitRealtimeEvent()`. TER muss eine funktionierende Realtime-Infrastruktur haben (SpacetimeDB oder Supabase Realtime). Ohne Realtime sehen andere Clients Theme-Aenderungen erst nach Page-Reload.

### 5.3 Migration bestehender User-Daten

Wenn User bereits `selected_theme` und `color_scheme` in ihren Profilen gespeichert haben, muessen diese ignoriert werden (fuer Nicht-Admins). Kein Daten-Migration noetig — die Snapshot-Logik liest nur Admin-Werte.

### 5.4 Theme-Editor-Context

`src/hooks/theme-editor-context.tsx` muss auf den neuen Store angepasst werden. Die Save-Logik muss ueber die neuen API-Routen laufen.

### 5.5 AI Theme Tools

`src/lib/ai/theme-tools.ts` referenziert `useTheme()`. Die API bleibt gleich, aber die Implementierung aendert sich (Store statt Context-State).

---

## 6. Empfohlene Reihenfolge

1. **Neue Dateien erstellen** (types, constants, css, apply-active-theme-css, theme-save-merge, snapshot, theme-store)
2. **storage.ts umschreiben** (API-basiert, kein Supabase-Client)
3. **theme-provider.tsx umschreiben** (Store-basiert, initialSnapshot)
4. **API-Routen anpassen** (GET Snapshot, PUT Admin-only + Sync)
5. **layout.tsx anpassen** (Server-Snapshot, kein localStorage im FOUC-Script)
6. **Sync-Hooks leeren** (use-color-scheme-sync, use-theme-sync-with-user)
7. **User-Theme-Seite entfernen** (benutzer-menue/theme)
8. **Navigation anpassen** (Theme-Link aus User-Menue entfernen)
9. **Admin-Seiten pruefen** (design-system, theme-manager auf neuen Store)
10. **Theme-Editor-Context + AI-Tools anpassen**
11. **Testen:** Admin aendert Theme -> alle Clients sehen es sofort

---

## 7. Geschaetzter Aufwand

| Phase                 | Dateien | Komplexitaet                                      |
| --------------------- | ------- | ------------------------------------------------- |
| Phase 1: Neue Dateien | 7       | Mittel (Portierung aus iryse mit TER-Anpassungen) |
| Phase 2: Umschreiben  | 7       | Hoch (Kernlogik aendert sich)                     |
| Phase 3: UI           | 3-4     | Niedrig (Entfernen + Navigation)                  |
| Phase 4: API          | 2-3     | Mittel (Admin-Sync + Snapshot)                    |
| Testing + Debugging   | -       | Hoch (Race Conditions, FOUC, Cache)               |

**Gesamt: ~20+ Dateien betroffen, davon 7 komplett neu, 7 grundlegend umgeschrieben.**

---

## 8. Design-System-Seite: Detailvergleich und Persistenz-Bugs

Die Design-System-Seite (`/app-verwaltung/design-system`) ist das Herzstück des visuellen Token-Editors. In beiden Projekten ist sie mit ~1.600 Zeilen die groesste einzelne Seite. Der Code ist strukturell fast identisch (gleicher Boilerplate-Ursprung), aber die Persistenz-Mechanismen unterscheiden sich fundamental.

### 8.1 Kernproblem: Alles wird nur "live" geaendert, fast nichts persistent

In TER funktioniert die Design-System-Seite nach diesem Muster:

1. User bewegt einen Slider oder waehlt eine Farbe
2. `previewToken(tokenName, lightValue, darkValue)` wird aufgerufen
3. Die CSS-Variable wird per `root.style.setProperty()` direkt im DOM gesetzt
4. Die Aenderung wird in `pendingChanges` (einer `Map<string, TokenValue>`) gespeichert
5. **Aber:** `pendingChanges` existiert nur im React-State (Memory) — bei Reload ist alles weg

**Das persistente Speichern erfordert** einen expliziten "Theme speichern"-Klick, der dann `saveAsNewTheme()` oder den Overwrite-Pfad aufruft. Dieser Pfad hat in TER mehrere fundamentale Bugs.

### 8.2 Bug-Katalog: Save/Overwrite-Pfad in TER

#### Bug 1: Overwrite verliert Dark-Mode-Werte (KRITISCH)

**Datei:** `src/components/theme/SaveThemeDialog.tsx` Zeile 93-150

TER's Overwrite-Logik hat einen fundamentalen Fehler bei der Erfassung von Light/Dark-Werten:

```typescript
// TER: SaveThemeDialog.tsx Zeile 101
const currentTokens = getCurrentTokens()

// Zeile 107-123: Problem
const isDarkMode = document.documentElement.classList.contains("dark")
Object.entries(currentTokens).forEach(([tokenName, value]) => {
  const pending = pendingChanges.get(tokenName)
  if (pending) {
    allTokens.set(tokenName, pending)
  } else {
    // FEHLER: Nur der aktuelle Mode wird gelesen!
    const currentValue = isDarkMode ? value.dark : value.light
    if (currentValue) {
      // Setzt denselben Wert fuer BEIDE Modi
      allTokens.set(tokenName, { light: currentValue, dark: currentValue })
    }
  }
})
```

**Problem:** `getCurrentTokens()` kann nur die Werte des aktuellen Modus (light ODER dark) aus dem DOM lesen. Fuer Tokens, die NICHT in `pendingChanges` sind, wird derselbe Wert fuer beide Modi gesetzt. Das bedeutet:

- Im Light-Mode gespeichert: Dark-Mode bekommt Light-Werte → kaputtes Dark-Theme
- Im Dark-Mode gespeichert: Light-Mode bekommt Dark-Werte → kaputtes Light-Theme

**iryse-Loesung:** Komplett anderer Ansatz in `overwriteCurrentTheme()`:

```typescript
// iryse: theme-editor-context.tsx Zeile 374-445
// 1. Laedt das existierende CSS aus Storage
const existingCss = await fetchThemeCSS(baseThemeId, { forceRefresh: true })
// 2. Parst Light UND Dark Bloecke aus dem CSS
const existingBlocks = parseThemeTokenBlocks(baseThemeId, existingCss)
// 3. Merged pendingChanges in BEIDE Bloecke
mergePendingTokenChanges(lightTokens, darkTokens, pendingChanges)
// 4. Baut neues CSS mit korrekten Light UND Dark Werten
```

Dies liest die bestehenden Werte aus dem gespeicherten CSS (das beide Modi enthaelt), nicht aus dem DOM (das nur den aktuellen Modus zeigt).

#### Bug 2: Kein existierendes CSS als Basis beim Overwrite (KRITISCH)

**Datei:** `src/components/theme/SaveThemeDialog.tsx`

TER liest beim Overwrite NICHT das bestehende Theme-CSS aus Storage. Es baut die CSS-Bloecke komplett aus DOM-Werten neu auf (Zeile 127-140). Das bedeutet:

- Tokens, die nicht in der `COLOR_TOKENS`-Liste stehen, gehen verloren
- Spezielle Werte (Shadows, Fonts, Meta-Tokens) werden nicht beruecksichtigt
- Das Theme schrumpft bei jedem Overwrite, weil nur die bekannten Tokens neu geschrieben werden

**iryse-Loesung:** Overwrite basiert auf dem existierenden CSS + Merge:

```typescript
const existingCss = await fetchThemeCSS(baseThemeId!, { forceRefresh: true })
const existing = parseThemeTokenBlocks(baseThemeId!, existingCss)
let lightTokens = { ...existing.light }
let darkTokens = { ...existing.dark }
mergePendingTokenChanges(lightTokens, darkTokens, pendingChanges)
```

#### Bug 3: Keine Verifikation nach dem Speichern (HOCH)

**Datei:** `src/hooks/theme-editor-context.tsx`

TER's `saveAsNewTheme()` (Zeile 226-264) speichert und hofft. Es gibt keine Pruefung, ob das CSS tatsaechlich korrekt im Storage angekommen ist.

**iryse-Loesung:** Dreifache Verifikation:

1. **`fetchThemeCssAfterSave()`** — Pollt das CSS mit Retry-Delays (300ms, 800ms, 1500ms), weil Supabase Storage eventual-consistent sein kann
2. **`verifySavedThemeMatchesPending()`** — Vergleicht jeden Token im gespeicherten CSS mit den pendingChanges
3. **`assertParsedThemeTokens()`** — Verhindert destruktives Speichern, wenn CSS existiert aber kein Block geparst werden konnte
4. **Diagnostik-Logging** in drei Phasen: pre-save, verify-mismatch, verified

```typescript
// iryse: theme-editor-context.tsx Zeile 421-441
const savedCss = await fetchThemeCssAfterSave(baseThemeId!)
if (savedCss) {
  verifySavedThemeMatchesPending(baseThemeId!, savedCss, pendingChanges)
}
```

#### Bug 4: CSS wird nicht sofort nach Speichern angewandt (MITTEL)

**Datei:** `src/components/theme/SaveThemeDialog.tsx`

TER's Overwrite-Pfad ruft `refreshThemeCSS()` auf (Zeile 154), was den `<link>` Tag mit Cache-Buster neu laedt. Aber:

- Der Browser-Cache kann trotz Cache-Buster das alte CSS liefern
- Es gibt kein `applyActiveThemeCss()` das den `<style>` Tag sofort ueberschreibt
- Das UI kann fuer Sekunden das alte Theme zeigen

**iryse-Loesung:** Sofortige DOM-Injection nach Speichern:

```typescript
// iryse: SaveThemeDialog.tsx Zeile 96
applyActiveThemeCss(getCurrentThemeStoreSnapshot().cssText)
```

#### Bug 5: saveAsNewTheme baut CSS direkt statt ueber Utility (MITTEL)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 240-258

TER baut die CSS-Strings inline zusammen:

```typescript
const lightCSS = `:root[data-theme="${themeId}"] {\n${lightLines.join("\n")}\n}`
const darkCSS = `.dark[data-theme="${themeId}"] {\n${darkLines.join("\n")}\n}`
```

**iryse-Loesung:** Nutzt die reine Utility-Funktion `buildThemeCss()`:

```typescript
const lightCss = buildThemeCss(themeId, lightTokens, false)
const darkCss = buildThemeCss(themeId, darkTokens, true)
```

Die Utility liegt in `theme-save-merge.ts` und ist unit-testbar, wiederverwendbar und konsistent.

#### Bug 6: `isDirty` erkennt nicht alle Aenderungen (MITTEL)

**Datei:** `src/hooks/theme-editor-context.tsx`

TER's `isDirty` basiert nur auf `pendingChanges.size > 0`. Inline-Styles, die direkt ueber Slider gesetzt wurden aber nicht in pendingChanges gelandet sind, werden nicht erkannt.

**iryse-Loesung:** Doppelte Pruefung:

```typescript
const isDirty = pendingChanges.size > 0 || hasInlinePreviewChanges()
```

`hasInlinePreviewChanges()` prueft, ob IRGENDEIN editierbarer Token eine Inline-Style-Ueberschreibung auf dem Root-Element hat.

### 8.3 Design-System-Seite: Strukturvergleich

Beide Seiten haben nahezu identische UI-Sektionen (gleicher Boilerplate-Ursprung):

| Sektion            | Tokens              | TER Zeilen | iryse Zeilen  | Unterschiede    |
| ------------------ | ------------------- | ---------- | ------------- | --------------- |
| Core Theme Colors  | 7 Paare (14 Tokens) | 1099-1113  | 1182-1195     | Identisch       |
| Borders            | 3 Tokens            | 1115-1129  | 1198-1211     | Identisch       |
| Status Colors      | 5 Paare (10 Tokens) | 1131-1164  | 1214-1246     | Identisch       |
| Chart Colors       | 5 Tokens            | 1166-1209  | 1249-1291     | Identisch       |
| Sidebar Colors     | 3 Paare + 2 Border  | 1211-1236  | 1294-1318     | Identisch       |
| Radius & Spacing   | 2 Slider            | 1238-1300  | 1321-1382     | Identisch       |
| Typography         | 3 Fonts + Spacing   | 1302-1388  | 1385-1470     | Identisch       |
| Shadows            | 5 Slider + Color    | 1390-1535  | 1473-1602     | Identisch       |
| Global Adjustments | 3 Slider            | 1537-1600  | 1605-1667     | Identisch       |
| **Save Bar**       | —                   | 1595-1605  | **1671-1687** | **VERSCHIEDEN** |

**Der einzige sichtbare Unterschied ist die Save Bar:**

- **TER:** Nur "Verwerfen" + "Theme speichern" (oeffnet SaveThemeDialog mit RadioGroup)
- **iryse:** "Verwerfen" + "Theme speichern" (oeffnet SaveThemeDialog mit **2-Schritt-Flow**: erst "Ueberschreiben" oder "Kopie", dann Name-Eingabe)

### 8.4 SaveThemeDialog: Fundamentaler Redesign in iryse

| Aspekt                 | TER                                               | iryse                                                 |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| **Dateigroesse**       | 250 Zeilen                                        | 276 Zeilen                                            |
| **UI-Flow**            | RadioGroup (overwrite/new) in einem Dialog        | 2-Schritt-Flow: Choice-Screen → Copy-Screen           |
| **Overwrite-Logik**    | Inline in Dialog (Zeile 93-150), baut CSS aus DOM | Delegiert an `overwriteCurrentTheme()` im Context     |
| **Save-as-New**        | `saveAsNewTheme()` aus Context                    | `saveAsNewTheme()` aus Context + Error-Recovery       |
| **Nach dem Speichern** | `refreshThemeCSS()` + `refreshThemes()`           | `refreshThemeCSS()` + `applyActiveThemeCss()` + Toast |
| **Builtin-Schutz**     | `isDefaultTheme` Check                            | `isBuiltinTheme` Check (allgemeiner)                  |
| **Error-Recovery**     | Einfacher Try-Catch                               | Separates Try-Catch fuer setTheme und refreshThemes   |
| **Toast-Feedback**     | Kein Toast                                        | `toast.success("Theme gespeichert")`                  |

### 8.5 Theme-Editor-Context: Kernunterschiede

| Aspekt                        | TER (299 Zeilen)                           | iryse (481 Zeilen)                                                               |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| **Imports**                   | `saveTheme` direkt                         | `saveTheme` + `fetchThemeCSS` + `fetchTheme` + CSS-Parser + Save-Merge Utilities |
| **overwriteCurrentTheme()**   | **Fehlt komplett**                         | 72 Zeilen mit CSS-Fetch, Parse, Merge, Verify                                    |
| **isBuiltinTheme**            | Fehlt                                      | Boolean aus Theme-Registry                                                       |
| **Verifikation**              | Keine                                      | `verifySavedThemeMatchesPending()` + Retry-Polling                               |
| **EDITABLE_TOKENS**           | Inline in `getCurrentTokens()` (52 Tokens) | Separate Konstante (36 Tokens, inkl. Meta-Tokens)                                |
| **hasInlinePreviewChanges()** | Fehlt                                      | Prueft alle editierbaren Tokens auf Inline-Styles                                |
| **fetchThemeCssAfterSave()**  | Fehlt                                      | Pollt mit Retries (300ms, 800ms, 1500ms)                                         |
| **Diagnostik-Logging**        | Fehlt                                      | 3-Phasen-Logging (nur in Development)                                            |
| **useThemeEditorOptional()**  | Fehlt                                      | Gibt null statt Error zurueck (fuer optionale Nutzung)                           |
| **extractDynamicFonts()**     | Fehlt                                      | Extrahiert Fonts aus CSS-Variablen, filtert System-Fonts                         |
| **System-Font-Filter**        | Fehlt                                      | 18 System-Fonts explizit ausgeschlossen                                          |

### 8.6 Bekannte Persistenz-Bugs pro Token-Typ

Basierend auf der Analyse, welche Token-Typen beim Speichern Probleme haben:

| Token-Typ              | Preview funktioniert? | Overwrite persistent?                     | Save-as-New persistent?              | Bug-Ursache                           |
| ---------------------- | --------------------- | ----------------------------------------- | ------------------------------------ | ------------------------------------- |
| **Color (einzeln)**    | Ja                    | **NEIN** — nur aktueller Mode gespeichert | Ja (via pendingChanges)              | Overwrite liest nur DOM               |
| **Color (Paar)**       | Ja                    | **NEIN** — gleicher Bug                   | Ja                                   | Overwrite liest nur DOM               |
| **Radius**             | Ja                    | **TEILWEISE** — Wert ok, aber nur 1 Mode  | Ja                                   | —                                     |
| **Spacing**            | Ja                    | **TEILWEISE**                             | Ja                                   | —                                     |
| **Letter-Spacing**     | Ja                    | **TEILWEISE**                             | Ja                                   | —                                     |
| **Fonts**              | Ja                    | **NEIN** — dynamicFonts-Array fehlt       | **NEIN** — extractDynamicFonts fehlt | Font-Extraktion fehlt                 |
| **Shadows**            | Ja                    | **NEIN** — identisch fuer light/dark      | Ja                                   | Absichtlich, aber falsch              |
| **Corner-Style**       | Ja                    | **NEIN** — kein CSS-Selektor              | **NEIN**                             | data-attr, nicht CSS-Var              |
| **Global Adjustments** | Ja                    | **NEIN** — Meta-Tokens nicht gespeichert  | **NEIN**                             | Meta-Tokens in EDITABLE_TOKENS fehlen |
| **Chart Hue Spacing**  | Ja                    | **NEIN** — Meta-Token fehlt               | **NEIN**                             | Meta-Token fehlt                      |

**Zusammenfassung:** Von 9 Token-Typen funktioniert das Overwrite bei **keinem einzigen** vollstaendig korrekt, und Save-as-New hat Probleme bei 4 von 9 Typen.

### 8.7 Meta-Tokens: Das fehlende Stueck

iryse hat das Konzept von **Meta-Tokens** eingefuehrt — CSS-Variablen, die nicht visuell wirken, sondern den Zustand von Slidern speichern:

```
--meta-hue-shift: 0
--meta-saturation-mult: 1.0
--meta-lightness-mult: 1.0
--meta-chart-hue-spacing: 72
```

Diese Meta-Tokens werden:

1. Beim Slider-Bewegen als `previewToken()` gesetzt
2. Im CSS gespeichert (in der `EDITABLE_TOKENS`-Liste)
3. Beim Laden der Design-System-Seite aus dem CSS zurueckgelesen
4. Die Slider werden auf die gespeicherten Werte initialisiert

**In TER fehlen diese Meta-Tokens komplett.** Das bedeutet:

- Global Adjustments gehen bei Reload verloren
- Chart Hue Spacing geht bei Reload verloren
- Die Slider starten immer bei Default-Werten (0, 1.0, 1.0, 72)
- Es ist unmoeglich, eine vorherige Einstellung wiederherzustellen

### 8.8 API-Route-Unterschiede

#### `/api/themes/save` — Overwrite-Modus

| Aspekt           | TER                        | iryse                                      |
| ---------------- | -------------------------- | ------------------------------------------ |
| **upsert**       | `false` (nur neue)         | `true` (ueberschreibt)                     |
| **CSS-Format**   | lightCSS + darkCSS separat | lightCSS + darkCSS mit Kommentar-Separator |
| **dynamicFonts** | Array direkt               | Array mit String-Filter                    |
| **Realtime**     | Kein Event                 | `emitRealtimeEvent("themes:updated")`      |
| **Caching**      | Kein Cache-Header          | Invalidiert Client-Caches                  |

#### `/api/themes/css` — CSS-Download-Route

| Aspekt             | TER      | iryse                                       |
| ------------------ | -------- | ------------------------------------------- |
| **Existiert**      | **NEIN** | Ja (37 Zeilen)                              |
| **Auth**           | —        | Authenticated User                          |
| **Caching**        | —        | 300s max-age, 600s stale-while-revalidate   |
| **Path Traversal** | —        | `id.includes("/")` Pruefung                 |
| **Resolver**       | —        | `resolveThemeCss()` mit Multi-Path-Fallback |

#### `/api/themes/import` — Cache-Invalidierung

| Aspekt                | TER                           | iryse                                     |
| --------------------- | ----------------------------- | ----------------------------------------- |
| **Nach Import**       | Kein Broadcast                | `emitRealtimeEvent("themes:updated")`     |
| **Theme-Aktivierung** | Client ruft `setTheme()`      | Client ruft `setTheme()` via Store        |
| **Theme-Liste**       | Muss manuell refreshed werden | Wird per Realtime an alle Clients gepusht |

### 8.9 Empfehlung: Uebernahme-Strategie

Die Design-System-Seite kann **nicht 1:1 kopiert** werden, weil sie von der darunterliegenden Infrastruktur abhaengt. Die Strategie ist:

1. **Zuerst die Infrastruktur portieren** (Phase 1-4 aus Abschnitt 6)
2. **Dann den Theme-Editor-Context von iryse uebernehmen** — das ist die Kernverbesserung (overwriteCurrentTheme, Verifikation, isDirty, EDITABLE_TOKENS mit Meta-Tokens)
3. **SaveThemeDialog von iryse uebernehmen** — 2-Schritt-Flow mit separatem Overwrite/Copy
4. **Design-System-Seite anpassen** — die Slider-Initialisierung muss Meta-Tokens laden, die Save-Bar muss den neuen Dialog nutzen

**Dateien die 1:1 kopiert werden koennen** (reine Utilities ohne Projekt-Abhaengigkeit):

- `src/lib/themes/theme-save-merge.ts` (107 Zeilen, pure Functions)
- `src/lib/themes/css.ts` (115 Zeilen, CSS-Parsing)
- `src/lib/themes/apply-active-theme-css.ts` (24 Zeilen, DOM-Injection)
- `src/lib/themes/types.ts` (Interface-Definitionen)
- `src/lib/themes/constants.ts` (Konstanten)

**Dateien die angepasst werden muessen:**

- `src/lib/themes/snapshot.ts` — Auth-Imports + Core-Store-API koennen sich unterscheiden
- `src/lib/themes/theme-store.ts` — Storage-Import-Pfade
- `src/lib/themes/storage.ts` — Tenant-Pfad-Logik
- `src/hooks/theme-editor-context.tsx` — Imports, Store-Integration
- `src/components/theme/SaveThemeDialog.tsx` — Imports

**Dateien die NUR in der Infrastruktur angepasst werden:**

- `src/app/(shell)/app-verwaltung/design-system/page.tsx` — Die UI-Sektionen bleiben identisch. Nur die Meta-Token-Initialisierung und die Save-Bar aendern sich.

---

## 9. Boilerplate-Verbesserungen fuer zukuenftige Projekte

Basierend auf den gefundenen Schwaechen sollte der Boilerplate-Code folgende Aenderungen erhalten:

### 9.1 Theme-System-Defaults

1. **Server-Snapshot als Default** — Kein localStorage als Source of Truth mehr
2. **Admin-only Theme-Aenderungen** — `canSelectTheme` ist per Default `false`
3. **Meta-Tokens in EDITABLE_TOKENS** — von Anfang an enthalten
4. **Verifikation nach Speichern** — `verifySavedThemeMatchesPending()` als Standard
5. **`<style>` statt `<link>`** — CSS-Injection in den DOM statt externe Stylesheets

### 9.2 Fehlende Dateien im Boilerplate

Diese Dateien muessen im Boilerplate standardmaessig vorhanden sein:

| Datei                       | Zweck                                          | Zeilen |
| --------------------------- | ---------------------------------------------- | ------ |
| `theme-save-merge.ts`       | Pure Save/Verify/Merge Utilities               | ~107   |
| `css.ts`                    | CSS-Parsing (Light/Dark-Bloecke, Corner-Style) | ~115   |
| `apply-active-theme-css.ts` | DOM-Injection fuer `<style>` Tag               | ~24    |
| `snapshot.ts`               | Server-seitiger Theme-Snapshot                 | ~85    |
| `theme-store.ts`            | External Store mit `useSyncExternalStore`      | ~163   |
| `types.ts`                  | Interface-Definitionen                         | ~25    |
| `constants.ts`              | DEFAULT_THEME_ID, THEME_SNAPSHOT_TOPIC         | ~3     |

### 9.3 API-Route: `/api/themes/css`

Muss im Boilerplate enthalten sein mit:

- Auth-Check (nicht Admin, nur authenticated)
- Path-Traversal-Schutz
- Cache-Headers (300s max-age)
- `resolveThemeCss()` mit Multi-Path-Fallback

### 9.4 Sync-Hooks als leere Stubs

Die Hooks `use-color-scheme-sync.tsx` und `use-theme-sync-with-user.tsx` sollten im Boilerplate als leere Stubs ankommen, nicht mit 200+ Zeilen bidirektionalem Sync-Code.

---

## 10. Adversarial Review: Verbleibende Bugs und Schwaechen im iryse-Code

Auch der iryse-Code hat nach dem grossen Refactor noch Schwaechen. Einige sind subtil, andere koennen unter bestimmten Bedingungen zu Datenverlust oder inkonsistentem State fuehren. Diese Findings gelten gleichzeitig als Warnung fuer die TER-Portierung — sie sollten bei der Uebernahme direkt mitbehoben werden.

### 10.1 Verifikation nach Save ist Silent-Fail (HOCH)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 432-440

```typescript
const verifiedCss = await fetchThemeCssAfterSave(baseThemeId)
try {
  verifySavedThemeMatchesPending(baseThemeId, verifiedCss, pendingChanges)
} catch (verifyError) {
  logThemeSaveDiagnostics("overwrite:verify-mismatch", { ... })
}
```

**Problem:** Die Verifikation ist in ein try-catch eingewickelt, das den Fehler **nur loggt, aber nicht wirft**. Der User bekommt bei gescheiterter Verifikation ein `toast.success("Theme gespeichert")`, obwohl das Theme moeglicherweise nicht korrekt gespeichert wurde. Die diagnostischen Logs sind nur im Development-Modus sichtbar.

**Fix:** Bei Verifikations-Mismatch sollte mindestens ein `toast.warning()` angezeigt werden, oder die Exception sollte nach oben propagiert werden, damit der SaveThemeDialog sie als Error anzeigt.

### 10.2 `getCurrentTokens()` hat einseitigen Mode-Blindspot (HOCH)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 291-316

```typescript
const isDark = root.classList.contains("dark")
const { activeThemeId, cssText } = getCurrentThemeStoreSnapshot()
const cssBlocks = parseThemeTokenBlocks(activeThemeId, cssText)

EDITABLE_TOKENS.forEach((tokenName) => {
  const value = computedStyle.getPropertyValue(tokenName).trim()
  const oppositeValue = isDark
    ? (cssBlocks.light[tokenName] ?? "")
    : (cssBlocks.dark[tokenName] ?? "")
  ...
})
```

**Problem:** Der "opposite mode" Wert wird aus den CSS-Bloecken im Store-Snapshot geladen. Aber wenn `cssText` im Snapshot `null` ist (z.B. beim Default-Theme, das keine Storage-CSS hat), sind ALLE opposite-Werte leere Strings. Das heisst:

- Im Light-Mode: Alle Dark-Werte sind `""` -> beim Save-as-New werden leere Dark-Tokens geschrieben
- Im Dark-Mode: Alle Light-Werte sind `""` -> analoges Problem

Der Fallback im `saveAsNewTheme()` (Zeile 339-346) greift zwar in diesem Fall, aber `getCurrentTokens()` liefert fuer den Gegenmodus leere Strings statt der tatsaechlich berechneten Werte. Das ist inkonsistent und kann bei Builtin-Themes zu Datenverlust fuehren.

**Fix:** Wenn `cssBlocks` fuer einen Mode leer sind, sollte `invertLightness()` auf den aktuellen Modus-Wert angewendet werden, statt einen leeren String zurueckzugeben. Alternativ: Warnung loggen.

### 10.3 `parseThemeTokenBlocks` Regex kann bei verschachteltem CSS scheitern (MITTEL)

**Datei:** `src/lib/themes/css.ts` Zeile 77-106

```typescript
const lightRegex = new RegExp(
  `(?:\\:root)?\\[data-theme="${escapedThemeId}"\\]\\s*\\{([^}]+)\\}`,
  "i"
)
```

**Problem:** Die Regex nutzt `[^}]+` fuer den Block-Inhalt. Das bricht, wenn ein Token-Wert selbst geschweifte Klammern enthaelt — z.B. bei CSS-Funktionen wie `color-mix(in oklch, var(--primary) 50%, white)`. Die Regex wuerde den Block am ersten `}` innerhalb des Werts abschneiden.

Aktuell wird dieser Fall nicht auftreten, da alle gespeicherten Werte OKLCH-Strings sind. Aber wenn zukuenftig komplexere CSS-Werte gespeichert werden (z.B. `calc()`, `color-mix()`, oder Gradient-Werte), wird der Parser stumm falsche Ergebnisse liefern.

**Fix:** Eine brace-counting Parsing-Strategie verwenden (wie sie bereits in `parseTweakCNCSS()` in der Import-Route verwendet wird, Zeile 305-313), statt einer Regex mit `[^}]+`.

### 10.4 Overwrite nutzt `/api/themes/save` statt `/api/themes/edit` (MITTEL)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 419

```typescript
const result = await saveTheme({ id: baseThemeId, ... })
```

`saveTheme()` ruft `/api/themes/save` auf, die `upsert: true` verwendet. Das funktioniert zwar, ist aber semantisch falsch — Edit-Operationen sollten die Edit-Route nutzen, die:

- Nicht-Existenz prueft (404)
- Builtin-Schutz hat
- Bestehende Metadaten bewahrt wenn nicht explizit ueberschrieben

**Konsequenz:** Ein Overwrite auf ein Theme, das gerade von einem anderen Admin geloescht wurde, wuerde es stillschweigend neu erstellen statt einen 404-Fehler zu geben. Die `requireAdmin()`-Pruefung fehlt ebenfalls in der Kette — `saveTheme()` prueft Admin-Rechte auf dem Server, aber der Client-Code `overwriteCurrentTheme()` prueft nicht vorab ob der User Admin ist.

**Fix:** `overwriteCurrentTheme()` sollte eine separate `updateThemeWithCSS()` Funktion nutzen die auf `/api/themes/edit` zeigt, oder der Save-Route sollte ein expliziter `mode: "create" | "update"` Parameter mitgegeben werden.

### 10.5 Doppeltes `themeSnapshotCache = snapshot` Assignment (NIEDRIG, Code-Smell)

**Datei:** `src/lib/themes/storage.ts` Zeile 318-321

```typescript
const snapshot = data as ThemeSnapshot & { success?: boolean }
themeSnapshotCache = snapshot // Erste Zuweisung
invalidateThemeCaches() // Setzt themeSnapshotCache = null
themeSnapshotCache = snapshot // Zweite Zuweisung (repariert den Invalidate)
```

**Problem:** `invalidateThemeCaches()` setzt `themeSnapshotCache = null`, weshalb die zweite Zuweisung noetig ist. Das ist fragil — wenn jemand die Reihenfolge aendert oder den zweiten Aufruf entfernt, geht der Snapshot-Cache verloren.

**Fix:** `invalidateThemeCaches()` sollte einen optionalen Parameter `excludeSnapshot: boolean` haben, oder der Code sollte selektiv nur Themes-Cache invalidieren:

```typescript
invalidateThemeCaches() // ohne Snapshot
themeSnapshotCache = snapshot
```

### 10.6 `fetchThemeCssAfterSave` pollt via Client-API, aber Save geht via Server (MITTEL)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 186-196

Die Verifikation nach dem Save ruft `fetchThemeCSS(themeId, { forceRefresh: true })` auf, was ueber `/api/themes/css` geht. Diese Route hat `Cache-Control: public, max-age=300`. Das bedeutet:

- Der Browser kann trotz `forceRefresh` auf dem Client eine Browser-Cache-Antwort liefern, weil der Fetch `cache: "no-store"` zwar gesetzt ist, aber zwischen Client und Server kann ein CDN oder Service Worker sitzen.
- Die CSS-Route liest aus Supabase Storage — Supabase hat keinen garantierten Immediate-Consistency fuer Storage-Operationen.

Die 3 Retries (300ms, 800ms, 1500ms) mildern das Problem, aber es kann bei langsamer Storage-Propagation trotzdem zu falsch-negativen Verifikationen kommen.

**Fix:** Die Verifikation sollte optional sein und den User bei Fehlschlag warnen (nicht blockieren). Ein besserer Ansatz waere, die CSS-Response direkt aus dem `saveTheme()`-Aufruf zurueckzugeben (der Server hat das CSS ja gerade geschrieben).

### 10.7 `resetPreview` entfernt nur `pendingChanges`-Tokens, nicht alle Inline-Styles (MITTEL)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 256-275

```typescript
const resetPreview = useCallback(() => {
  pendingChanges.forEach((_, tokenName) => {
    root.style.removeProperty(tokenName)
  })
  setPendingChanges(new Map())
}, [pendingChanges])
```

**Problem:** Wenn ein Slider einen Token per `previewToken()` setzt, dieser aber NICHT in `pendingChanges` landet (z.B. durch einen Bug oder eine Race Condition im `setPendingChanges` Call), bleibt der Inline-Style auf dem Root-Element bestehen. `resetPreview()` entfernt nur die Tokens, die es in der Map findet.

`hasInlinePreviewChanges()` erkennt das zwar (Zeile 198-207) und setzt `isDirty = true`, aber `resetPreview()` kann es nicht bereinigen.

**Fix:** `resetPreview()` sollte ALLE `EDITABLE_TOKENS` durchgehen und deren Inline-Styles entfernen, nicht nur die in `pendingChanges`:

```typescript
EDITABLE_TOKENS.forEach((tokenName) => {
  root.style.removeProperty(tokenName)
})
```

### 10.8 Keine Atomaritaet zwischen CSS-Upload und Registry-Update (MITTEL)

**Dateien:** `/api/themes/save/route.ts`, `/api/themes/edit/route.ts`

Beide Routen fuehren zwei separate Operationen durch:

1. CSS in Supabase Storage hochladen
2. Metadaten im Core-Registry aktualisieren

Wenn Schritt 2 fehlschlaegt, ist das CSS im Storage aber die Registry kennt das Theme nicht (save) oder hat veraltete Metadaten (edit). Es gibt keinen Rollback — die Save-Route (anders als die Import-Route) versucht nicht, das CSS zu loeschen wenn das Registry-Update fehlschlaegt.

**Konsequenz:** Verwaiste CSS-Dateien im Storage, die nie geloescht werden. Bei wiederholtem Speichern akkumulieren sich diese.

**Fix:** Bei fehlgeschlagenem Registry-Update sollte das gerade hochgeladene CSS geloescht werden (wie in der Import-Route bereits implementiert). Oder besser: Die Upload-Operation auf `upsert: true` belassen und bei Registry-Fehler eine explizite Storage-Cleanup durchfuehren.

### 10.9 `invertLightness()` ignoriert nicht-OKLCH Werte stumm (NIEDRIG)

**Datei:** `src/hooks/theme-editor-context.tsx` Zeile 32-43

```typescript
function invertLightness(oklchValue: string, offset: number = 0): string {
  const match = oklchValue.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) return oklchValue // <- Gibt den Originalwert zurueck
  ...
}
```

**Problem:** Wenn `previewToken()` mit nur einem Wert (light ODER dark) aufgerufen wird, wird `invertLightness()` fuer den Gegenmodus verwendet. Wenn der Eingabewert kein OKLCH-Format hat (z.B. `"0.5rem"` fuer `--radius`, oder `"Inter, sans-serif"` fuer `--font-sans`), gibt die Funktion den Originalwert unveraendert zurueck. Das ist korrekt fuer Nicht-Farb-Tokens, aber bei Farb-Tokens in Hex- oder RGB-Format wuerde Light == Dark gesetzt, was den Gegenmodus kaputt macht.

**Fix:** Entweder explizit nur fuer Farb-Tokens invertieren, oder einen Converter von Hex/RGB zu OKLCH vorschalten.

### 10.10 `/api/themes/css` Route cached auch `null`-Ergebnisse (NIEDRIG)

**Datei:** `src/app/api/themes/css/route.ts` Zeile 22-26

```typescript
const cacheHeaders = { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" }
if (!css) {
  return NextResponse.json({ css: null }, { headers: cacheHeaders })
}
```

**Problem:** Wenn ein Theme-CSS nicht gefunden wird (z.B. weil es gerade importiert wird), wird `null` fuer 5 Minuten gecacht. Innerhalb dieser 5 Minuten wird jeder Versuch, das CSS zu laden, `null` zurueckgeben — selbst wenn das CSS inzwischen existiert.

**Fix:** Fuer `null`-Ergebnisse sollte `no-cache` oder ein kuerzerer `max-age` gesetzt werden:

```typescript
if (!css) {
  return NextResponse.json(
    { css: null },
    {
      headers: { "Cache-Control": "private, max-age=10" },
    }
  )
}
```

### 10.11 Theme-ID-Kollision beim Import (NIEDRIG)

**Datei:** `/api/themes/import/route.ts` Zeile 284-288 + Zeile 72-78

Die Theme-ID wird aus dem Namen generiert (`slugify`), aber auf 50 Zeichen begrenzt. Zwei verschiedene Theme-Namen, die nach Slugification und 50-Zeichen-Limit identisch sind, wuerden kollidieren. Die Existenz-Pruefung (Zeile 72-78) verhindert das, aber die Fehlermeldung ist generisch ("Theme existiert bereits") und hilft dem User nicht zu verstehen, warum.

**Fix:** Entweder einen Counter anhaengen (`my-theme-2`), oder die Fehlermeldung expliziter gestalten: "Ein Theme mit der ID `{themeId}` existiert bereits. Bitte waehle einen anderen Namen."

### 10.12 Zusammenfassungstabelle iryse-Bugs

| #     | Schwere | Bug                                               | Auswirkung                                           | Aufwand |
| ----- | ------- | ------------------------------------------------- | ---------------------------------------------------- | ------- |
| 10.1  | HOCH    | Verifikation ist Silent-Fail                      | User glaubt Theme ist gespeichert, ist es aber nicht | Klein   |
| 10.2  | HOCH    | getCurrentTokens leer fuer Gegenmodus bei Builtin | Leere Tokens beim Save-as-New von Builtin-Themes     | Mittel  |
| 10.3  | MITTEL  | Regex-Parser bricht bei `{}` in CSS-Werten        | Stumm falsche Ergebnisse bei komplexen Werten        | Mittel  |
| 10.4  | MITTEL  | Overwrite nutzt Save- statt Edit-Route            | Stillschweigendes Neuerstellen geloeschter Themes    | Klein   |
| 10.5  | NIEDRIG | Doppeltes Cache-Assignment                        | Fragiler Code, Regressionsgefahr                     | Klein   |
| 10.6  | MITTEL  | Verifikation ueber cached API                     | Falsch-negative Verifikation moeglich                | Mittel  |
| 10.7  | MITTEL  | resetPreview entfernt nicht alle Inline-Styles    | Phantom-isDirty, nicht bereinigbare Styles           | Klein   |
| 10.8  | MITTEL  | Keine Atomaritaet CSS ↔ Registry                  | Verwaiste CSS-Dateien bei Registry-Fehler            | Klein   |
| 10.9  | NIEDRIG | invertLightness ignoriert Nicht-OKLCH             | Light == Dark bei Hex/RGB Farben                     | Klein   |
| 10.10 | NIEDRIG | null-CSS wird 5 Min gecacht                       | Neu importierte Themes nicht sofort ladbar           | Klein   |
| 10.11 | NIEDRIG | Theme-ID-Kollision bei langen Namen               | Unklare Fehlermeldung                                | Klein   |

### 10.13 Empfehlung fuer die TER-Portierung

Bei der Uebernahme des iryse-Codes nach TER (und zurueck in den Boilerplate) sollten die Bugs 10.1, 10.2, 10.7 und 10.8 **direkt mitbehoben** werden, da sie mit wenig Aufwand grossen Effekt haben:

1. **10.1:** Verifikations-Fehler als `toast.warning()` anzeigen statt stumm loggen
2. **10.2:** In `getCurrentTokens()` fuer leere opposite-Bloecke `invertLightness()` verwenden
3. **10.7:** `resetPreview()` ueber ALLE `EDITABLE_TOKENS` iterieren, nicht nur pendingChanges
4. **10.8:** In `/api/themes/save` bei Registry-Fehler das CSS per Storage-Delete zurueckrollen (wie Import-Route es bereits tut)
