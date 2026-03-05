# SpacetimeDB Spike - Validierungskriterien

## Ziel

Vor dem breiten UI-Cutover validieren:

1. **Echte Subscriptions** – Daten fliessen ohne Reload
2. **Reconnect/Backoff** – Verbindungsabbruch wird erkannt und wiederhergestellt
3. **Event Ordering** – Reihenfolge bleibt gewaehrleistet
4. **Duplicate Handling** – Duplikate werden gefiltert

## SpacetimeDB-Setup

### 1. SpacetimeDB Module anlegen

```bash
# Rust oder C# Quickstart folgen
# https://spacetimedb.com/docs/modules/rust/quickstart
```

### 2. Env-Variablen

```
NEXT_PUBLIC_SPACETIMEDB_ENABLED=true
NEXT_PUBLIC_SPACETIMEDB_URI=wss://...
NEXT_PUBLIC_SPACETIMEDB_DATABASE=...
```

### 3. Client-Bindings generieren

Nach Modul-Deploy: `spacetime generate` oder aehnlich. Bindings in `src/lib/realtime/bindings/`.

### 4. Spike-Vertical-Slice

Ein Bereich (z.B. Nav-Notification-Zaehler oder Chat-Sync-Status) mit:

- Subscription auf eine Tabelle/Reducer
- UI-Update ohne `window.location.reload`
- Reconnect-Test: Verbindung trennen, wieder verbinden

## Metrik-Schwellen (Go/No-Go)

- **UI-Latenz:** Update sichtbar &lt; 500ms nach Server-Event
- **Reconnect:** &lt; 5s bis Verbindung wiederhergestellt
- **Duplikate:** Keine doppelten UI-Updates bei gleichem Event

## Mock-Adapter

Ohne SpacetimeDB: `src/lib/realtime/mock-adapter.ts` fuer lokale Entwicklung und Tests.
