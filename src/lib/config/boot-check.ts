/**
 * Boot-Check: Pflicht- und Optional-Environment-Variablen einmalig validieren.
 *
 * Plan H2: Der Boilerplate-Kern braucht zwingend Clerk + SpacetimeDB.
 * Supabase ist rein optional — wenn gesetzt, sind die Beispiel-Features aktiv,
 * sonst liefern sie einen klaren 503 (`src/lib/config/features.ts`).
 *
 * `performBootCheck()` wird idempotent aus dem Root-Layout heraus aufgerufen.
 * Der erste Lauf protokolliert das Ergebnis auf stdout, weitere Aufrufe sind No-Ops.
 */

import { isSupabaseExamplesEnabled } from "./features"

interface EnvGroup {
  label: string
  keys: readonly string[]
}

const REQUIRED_GROUPS: readonly EnvGroup[] = [
  {
    label: "Clerk (Identity)",
    keys: ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
  },
  {
    label: "SpacetimeDB (Boilerplate-Core)",
    keys: [
      "NEXT_PUBLIC_SPACETIMEDB_URI",
      "NEXT_PUBLIC_SPACETIMEDB_DATABASE",
      "NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER",
    ],
  },
]

const OPTIONAL_GROUPS: readonly EnvGroup[] = [
  {
    label: "Supabase (App-DB fuer Beispiel-Features)",
    keys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
]

let bootChecked = false

function hasValue(key: string): boolean {
  const value = process.env[key]
  return typeof value === "string" && value.trim().length > 0
}

function missingKeys(group: EnvGroup): string[] {
  return group.keys.filter((key) => !hasValue(key))
}

/**
 * Validiert die Pflicht-Envs und protokolliert den Supabase-Status.
 *
 * @param options.throwOnMissing - bei `true` wirft die Funktion, wenn eine
 *   Pflicht-Variable fehlt (Default). Bei `false` wird nur geloggt — nuetzlich
 *   fuer Entwicklungs-Server, die erst spaeter konfiguriert werden.
 */
export function performBootCheck(options: { throwOnMissing?: boolean } = {}): void {
  if (bootChecked) return
  bootChecked = true

  const { throwOnMissing = true } = options
  const missingRequired: Array<{ group: string; keys: string[] }> = []

  for (const group of REQUIRED_GROUPS) {
    const missing = missingKeys(group)
    if (missing.length > 0) missingRequired.push({ group: group.label, keys: missing })
  }

  if (missingRequired.length > 0) {
    const details = missingRequired
      .map((entry) => `  - ${entry.group}: ${entry.keys.join(", ")}`)
      .join("\n")
    const message =
      "[boot-check] Pflicht-Environment-Variablen fehlen:\n" +
      details +
      "\n  Ohne diese Variablen laeuft der Boilerplate-Kern nicht."
    if (throwOnMissing) {
      throw new Error(message)
    }
    console.error(message)
  }

  const supabaseActive = isSupabaseExamplesEnabled()
  const supabaseMissing = OPTIONAL_GROUPS[0] ? missingKeys(OPTIONAL_GROUPS[0]) : []
  if (supabaseActive) {
    if (supabaseMissing.length === 0) {
      console.info("[boot-check] Supabase-Beispiel-Features: aktiv (alle Keys gesetzt).")
    } else {
      console.warn(
        `[boot-check] Supabase-URL gesetzt, aber ${supabaseMissing.join(", ")} fehlen — ` +
          "die betroffenen Beispiel-Features antworten mit 503."
      )
    }
  } else {
    console.info(
      "[boot-check] Supabase-Beispiel-Features: deaktiviert (NEXT_PUBLIC_SUPABASE_URL leer)."
    )
  }
}
