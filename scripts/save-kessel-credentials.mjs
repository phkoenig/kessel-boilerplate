#!/usr/bin/env node
// scripts/save-kessel-credentials.mjs
// Speichert die Credentials vom neuen Kessel-Projekt im Supabase Vault

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

// .env laden (Vault-Credentials)
config()

const VAULT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL // Vault-URL
const VAULT_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY // Vault Service Role Key

// Neue Kessel-Projekt Credentials
const KESSEL_PROJECT_REF = "ufqlocxqizmiaozkashi"
const KESSEL_URL = `https://${KESSEL_PROJECT_REF}.supabase.co`
const KESSEL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcWxvY3hxaXptaWFvemthc2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzExMTEsImV4cCI6MjA4MDgwNzExMX0.Un94TG_Kh_wrwv2686ZhVxPWU7Jyu56PMMuwltNHwkg"
const KESSEL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcWxvY3hxaXptaWFvemthc2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMTExMSwiZXhwIjoyMDgwODA3MTExfQ.ntLVeJZZIwVvjOnAkY9DnTuq7WeqkcsMxCZVpkPcktE"

if (!VAULT_URL || !VAULT_SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY müssen in .env gesetzt sein")
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
