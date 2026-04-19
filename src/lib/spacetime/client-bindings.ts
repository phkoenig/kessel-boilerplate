/**
 * Client-Bindings Barrel (Plan C-1 Stufe 1)
 *
 * Re-exportiert aus den generierten Spacetime-Bindings **nur** die Typen und
 * Klassen, die der Browser zum *Lesen* der Core-DB braucht (DbConnection,
 * DbConnectionBuilder, SubscriptionBuilder, `tables`).
 *
 * Reducer-Bezug darf in Client-Code nicht auftauchen. Der zugehoerige
 * Lint-Guard erzwingt das: `local/no-spacetime-reducers-in-client`.
 *
 * Server-Code (API-Routen, `src/lib/core/**`) importiert weiterhin direkt
 * aus `@/lib/spacetime/module-bindings`.
 */

export {
  DbConnection,
  DbConnectionBuilder,
  SubscriptionBuilder,
  tables,
} from "@/lib/spacetime/module-bindings"
