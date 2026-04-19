# UI Performance Architektur

> Kanonischer Referenzanker fuer Performance-Patterns in Kessel-Boilerplate-Ableitungen.
> Gilt fuer alle Next.js + Supabase + SpacetimeDB Projekte, die auf dieser Boilerplate basieren.

## Zielbild

Jede UI-Flaeche soll einen klaren, ruhigen Datenpfad haben:

1. Server aggregiert und normalisiert die fachlichen Daten in ein **UI-fertiges Snapshot-Modell**.
2. Ein **Shared Client Store pro Domaene** konsumiert genau einen REST-Bootstrap und (falls noetig) genau einen Push-/Realtime-Pfad.
3. **Commands** bleiben explizit getrennt und invalidieren gezielt die betroffenen Read-Modelle.

## Kernprinzipien

### 1. Ein Read-Pfad pro Domaene

Pro Domaene (z.B. "Projekte", "Dokumente", "Benutzereinstellungen") genau **einen** serverseitigen Snapshot bauen, der alles UI-relevante normalisiert liefert. Clientseitig genau **einen Shared Store**, der diesen Snapshot konsumiert.

**Warum:** Mehrere Komponenten, die dieselben Daten unabhaengig fetchen (Header laedt Profil, Sidebar laedt Profil, Page laedt Profil), multiplizieren Requests und erzeugen Race Conditions.

### 2. Globaler Bootstrap fuer Shell-Daten

Shell-weite Daten in einen einzigen Root-Bootstrap oder dauerhafte Shared Stores legen:

- `profile`
- `permissions`
- `effectiveTheme`
- `app-settings`
- Navigation-Configs

Diese Stores ueberleben Routenwechsel und werden nicht bei jeder Navigation neu gebootet. Nur bei expliziter Invalidation (z.B. nach Settings-Aenderung) neu laden.

**Warum:** Ohne das laden Header, Navigation, Provider und Seiteninhalt alle unabhaengig dieselben Daten. Bei jedem Routenwechsel wird alles neu gefetcht — das erzeugt Waterfall-Requests und sichtbare Traegheit.

### 3. Teure Reads als Hot Paths behandeln

Aggregat-Endpunkte (z.B. "alle Dokumente mit Status + Zuordnungen + letzte Aenderung"):

- **Serverseitig cachen** mit Event-getriggerter Invalidation (nicht nur TTL).
- **In-Flight-Request-Deduplizierung:** Wenn 3 Komponenten gleichzeitig denselben Endpunkt aufrufen, nur 1 Request tatsaechlich abschicken und das Promise sharen.
- **Stale-while-revalidate:** Sofort den Cache ausliefern, im Hintergrund aktualisieren.

**Warum:** Teure Aggregationen bei jedem Request neu zu berechnen, obwohl sich die Daten selten aendern, ist der haeufigste Grund fuer langsame API-Responses.

### 4. Lazy Mounting schwerer Nebenflaechen

Nur der primaere Screen-Inhalt gehoert in den Initial-Render-Pfad. Alles andere erst **on-demand mounten** (nicht nur `display: none`, sondern wirklich nicht rendern bis zum Oeffnen):

- Detail-Drawer und -Dialoge
- Historien und Audit-Logs
- Schwere Formulare und Editoren
- Admin-Panels
- Upload-Dialoge
- Design- und Theme-Werkzeuge

Das gilt auch fuer deren Daten-Fetches: kein Pre-Fetch fuer Dialoge, die 90% der User nie oeffnen.

### 5. Commands: gezielte Invalidation statt Full Reload

Nach einer Mutation gezielt nur die betroffenen Store-Teile updaten oder invalidieren:

- Kein `router.refresh()` oder `window.location.reload()` als Lazy-Fix.
- Optimistic Updates wo sinnvoll (UI sofort updaten, Server im Hintergrund bestaetigen).
- Commands loesen keine Voll-Reloads aus, sondern gezielte Store-Updates oder Invalidation.

### 6. Server Components First

- Default: **Server Components** fuer statische und read-mostly Flaechen.
- `'use client'` nur fuer: interaktive Komponenten, Hooks, Streams, Shared Stores.
- Fuer Live-Domaenen (wo SpacetimeDB push-first laeuft): Client Components mit Shared Store sind okay, aber die initiale Daten-Bereitstellung trotzdem serverseitig als Snapshot.

### 7. Keine Business-Logik in der UI

- Komponenten nur fuer Darstellung.
- Business-Logik, Filterung, Aggregation in eigene Services / Use-Cases / Server Actions.
- Fallbacks serverseitig aufloesen, nicht clientseitig aus mehreren Quellen zusammenkleben.

## SpacetimeDB: Domain-Grenzen

SpacetimeDB ist kein pauschales Migrationsziel fuer jede UI-Domaene:

- **SpacetimeDB einsetzen** wo Push-first und niedrige Latenz fachlich noetig sind: Live-Status, Echtzeit-Kollaboration, Runtime-State.
- **Supabase/Postgres beibehalten** fuer: Admin-Daten, Auth-Metadaten, Theme-Konfiguration, Produkt-/Projekt-Metadaten, Asset-Kataloge, Dokument-Stammdaten.
- **Entscheidungskriterium:** "Braucht diese Entitaet wirklich Sub-Sekunden-Push, oder reicht ein normaler REST-Read mit Cache?"

## Shared-Store-Muster

Shared Stores sollen mindestens leisten:

- **Bootstrap-Dedupe:** Erster Consumer laedt, alle weiteren warten auf dasselbe Promise.
- **Eine gemeinsame Live-Verbindung** (SSE, WebSocket oder SpacetimeDB Subscription) pro Domaene.
- **SSR-sicherer Snapshot** fuer `useSyncExternalStore`.
- **Gezielte `refresh()`-Moeglichkeit** fuer Command-getriggerte Invalidation.

## Anti-Patterns (Checkliste fuer Audits)

| Anti-Pattern                        | Symptom                                     | Fix                             |
| ----------------------------------- | ------------------------------------------- | ------------------------------- |
| Mehrfach-Fetch gleicher Daten       | Network Tab zeigt 3-5x denselben Endpunkt   | Shared Store + Dedupe           |
| Header/Nav fetchen separat          | Jeder Routenwechsel = Waterfall an Requests | Root-Bootstrap                  |
| Dialog pre-fetched Daten            | Grosser Initial-Bundle, lange TTFB          | Lazy Mount                      |
| Mutation -> Full Reload             | Seite flackert nach Save                    | Targeted Invalidation           |
| Alles Client Components             | Riesiges JS-Bundle, langsamer FCP           | Server Components First         |
| SpacetimeDB fuer alles              | Unnoetige Subscription-Komplexitaet         | Domain-Grenzen ziehen           |
| Teure Aggregation bei jedem Request | Langsame API-Responses                      | Server-Cache + Invalidation     |
| Polling statt Push                  | Dauerhafter Netzwerk-Traffic ohne Nutzen    | Push-first fuer Live-Daten      |
| Business-Logik in Komponenten       | Langsame Re-Renders, schwer testbar         | In Services/Use-Cases auslagern |

## Migrationsreihenfolge (empfohlen)

Fuer bestehende Projekte, die traege sind:

1. **Doppelte globale Reads entfernen** — Quick Win, sofort spuerbar.
2. **Shared Stores fuer Shell-Daten** einziehen (Profile, Theme, Permissions, Nav).
3. **Langsame Aggregat-Endpunkte** serverseitig cachen + invalidieren.
4. **Schwere Screens** auf Snapshot-First umbauen (Server liefert fertiges Modell, Client rendert nur).
5. **Neue Seiten** nur noch nach diesem Muster bauen.

## Server-Snapshot und Cache — Zielmuster

Teure Server-Aggregationen sollen:

- Normalisierte UI-Modelle liefern (ein Objekt pro Screen, nicht n+1 Queries).
- In-Flight-Requests deduplizieren.
- Per Invalidation oder kurzer TTL warm gehalten werden.
- Nicht bei jedem Hook-Consumer erneut berechnet werden.

Typische Kandidaten:

- Dashboard-Aggregate
- Dokumenten-Listen mit Status
- Theme-Listen
- `app-settings`
- Benutzer- und Rollen-Konfigurationen

## Referenzen

- Market Magnet Projekt: `docs/02_architecture/ui-live-data-and-performance.md` (Ursprung dieser Patterns)
- Next.js App Router Docs: Server vs. Client Components
- React `useSyncExternalStore` fuer SSR-sichere Shared Stores
