# Spacetime `spacetime generate` — Eigenheiten

**Scope:** Hinweise zur Arbeit mit `spacetime generate --lang typescript` im
Boilerplate-Core (`spacetime/core/spacetimedb`). Ergaenzt
[ADR-003](../02_architecture/ADR-003-db-agnostic-boilerplate-core.md).

## Private Tabellen erscheinen nicht als Client-Bindings

Tabellen, die im Modul mit `#[spacetimedb::table(name = "...", private)]`
markiert sind, werden vom `spacetime generate`-TypeScript-Emitter **nicht als
Top-Level-Bindings exportiert**. Auf sie kann vom Client nur ueber explizit
freigegebene Procedures (Reducer) zugegriffen werden.

### Konkretes Beispiel: `blob_asset`

Im Storage-Layer nutzen wir `blob_asset` als private Tabelle. Der Aufruf

```ts
await getBlobStorage().get("theme_css", "…/default.css")
```

schlaegt mit `No such procedure` fehl, solange keine passende Reducer/Reader-
Procedure generiert wurde. Waehrend der Migration auf den Spacetime-Storage
wurde das umgangen, indem temporaer der Supabase-Storage-Treiber verwendet
wurde (`BOILERPLATE_BLOB_STORAGE=supabase`).

### Empfohlener Umgang

1. Fuer jede private Tabelle genau pruefen, ob sie wirklich "privat" sein muss.
   Wenn der Client Daten lesen soll, die Tabelle oeffentlich machen oder eine
   klar benannte Reader-Procedure bereitstellen.
2. Nach Aenderungen an der Sichtbarkeit **immer** neu generieren:

   ```bash
   pnpm spacetime:generate
   ```

3. Tests, die den Storage-Layer benutzen, sollten gegen den `memory`-Treiber
   laufen (`getBlobStorage({ driver: "memory" })`), damit sie unabhaengig vom
   realen Binding sind.

## Siehe auch

- [ADR-003 — DB-agnostischer Boilerplate-Core](../02_architecture/ADR-003-db-agnostic-boilerplate-core.md)
- [GAP 260419 — Boilerplate-DB-Agnostik](../10_gaps/260419-boilerplate-db-agnostik-gap.md) (#NEW-1)
- `scripts/spacetime/generate.ts`
