#!/usr/bin/env node
// scripts/save-kessel-credentials.mjs
// Speichert die Credentials vom neuen Kessel-Projekt im Supabase Vault

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

// .env laden (Vault-Credentials + Ziel-Projekt)
config()

const VAULT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL // Vault-URL
const VAULT_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY // Vault Service Role Key

// Ziel-Projekt Credentials (aus Env, niemals hardcoden!)
const KESSEL_URL = process.env.TARGET_SUPABASE_URL
const KESSEL_ANON_KEY = process.env.TARGET_SUPABASE_ANON_KEY
const KESSEL_SERVICE_ROLE_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY

if (!VAULT_URL || !VAULT_SERVICE_ROLE_KEY) {
  console.error(
    "❌ VAULT: NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY müssen in .env gesetzt sein"
  )
  process.exit(1)
}
if (!KESSEL_URL || !KESSEL_ANON_KEY || !KESSEL_SERVICE_ROLE_KEY) {
  console.error(
    "❌ ZIEL-PROJEKT: TARGET_SUPABASE_URL, TARGET_SUPABASE_ANON_KEY, TARGET_SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein (z.B. in .env)"
  )
  process.exit(1)
}

async function saveSecretsToVault() {
  const vaultClient = createClient(VAULT_URL, VAULT_SERVICE_ROLE_KEY)

  const secrets = {
    NEXT_PUBLIC_SUPABASE_URL: KESSEL_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: KESSEL_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: KESSEL_SERVICE_ROLE_KEY,
  }

  console.log("🔐 Speichere Credentials im Supabase Vault...\n")

  for (const [key, value] of Object.entries(secrets)) {
    try {
      // Prüfe ob Secret bereits existiert
      const { data: existing } = await vaultClient.rpc("read_secret", {
        secret_name: key,
      })

      if (existing) {
        console.log(`⚠️  Secret "${key}" existiert bereits. Lösche und erstelle neu...`)
        // Altes Secret löschen
        await vaultClient.rpc("delete_secret", {
          secret_name: key,
        })
      }

      // Secret erstellen (oder neu erstellen)
      const { error } = await vaultClient.rpc("insert_secret", {
        name: key,
        secret: value,
      })

      if (error) {
        console.error(`❌ Fehler beim Speichern von "${key}":`, error.message)
      } else {
        console.log(`✅ Secret "${key}" erfolgreich ${existing ? "aktualisiert" : "gespeichert"}`)
      }
    } catch (err) {
      console.error(`❌ Fehler bei "${key}":`, err.message)
    }
  }

  console.log("\n✨ Fertig! Führe jetzt 'pnpm pull-env' aus, um die Secrets zu laden.")
}

saveSecretsToVault().catch((err) => {
  console.error("❌ Fehler:", err)
  process.exit(1)
})
