/**
 * Live-Test-Script für AI-Router
 *
 * Testet den AI-Router mit typischen Chatverläufen und gibt Erfolgsrate aus.
 * Ermöglicht Prompt-Optimierung durch Iteration.
 *
 * Usage: pnpm tsx scripts/test-ai-router.ts
 */

// Load environment variables
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { routeWithAI } from "../src/lib/ai/ai-router"
import type { CoreMessage } from "ai"

/**
 * Test-Szenarien mit erwarteten Kategorien
 */
const testScenarios: Array<{
  name: string
  messages: CoreMessage[]
  expected: "UI_ACTION" | "DB_QUERY" | "VISION" | "CHAT"
  description: string
}> = [
  // CHAT-Szenarien
  {
    name: "Einfache Begrüßung",
    messages: [{ role: "user", content: "Hallo, wie geht es dir?" }],
    expected: "CHAT",
    description: "Normale Begrüßung ohne Aktion",
  },
  {
    name: "Danksagung",
    messages: [{ role: "user", content: "Danke!" }],
    expected: "CHAT",
    description: "Einfache Danksagung",
  },
  {
    name: "Allgemeine Frage",
    messages: [{ role: "user", content: "Was kann diese App?" }],
    expected: "CHAT",
    description: "Informationsfrage ohne Aktion",
  },

  // UI_ACTION-Szenarien
  {
    name: "Explizite Navigation",
    messages: [{ role: "user", content: "Navigiere zu meinem Profil" }],
    expected: "UI_ACTION",
    description: "Direkte Navigationsanfrage",
  },
  {
    name: "Bestätigung nach Navigation-Angebot",
    messages: [
      { role: "assistant", content: "Möchtest du zu deinem Profil navigieren?" },
      { role: "user", content: "ja bitte" },
    ],
    expected: "UI_ACTION",
    description: "Kontext-bewusste Bestätigung",
  },
  {
    name: "Kurze Bestätigung",
    messages: [
      { role: "assistant", content: "Soll ich dich zu den Einstellungen navigieren?" },
      { role: "user", content: "ok" },
    ],
    expected: "UI_ACTION",
    description: "Kurze Bestätigung nach Angebot",
  },
  {
    name: "Imperativ-Bestätigung",
    messages: [
      { role: "assistant", content: "Ich kann dich zu Modul 1.1 navigieren." },
      { role: "user", content: "mach das" },
    ],
    expected: "UI_ACTION",
    description: "Imperativ-Bestätigung",
  },
  {
    name: "Panel-Toggle",
    messages: [{ role: "user", content: "Öffne die Sidebar" }],
    expected: "UI_ACTION",
    description: "Panel-Toggle-Anfrage",
  },
  {
    name: "Kontextuelle Frage",
    messages: [
      { role: "assistant", content: "Soll ich dich zu deinem Profil navigieren?" },
      { role: "user", content: "Kannst du das?" },
    ],
    expected: "UI_ACTION",
    description: "Kontextuelle Frage nach Angebot",
  },

  // DB_QUERY-Szenarien
  {
    name: "Benutzer auflisten",
    messages: [{ role: "user", content: "Zeige alle Benutzer" }],
    expected: "DB_QUERY",
    description: "Explizite Datenbank-Abfrage",
  },
  {
    name: "Benutzer erstellen",
    messages: [{ role: "user", content: "Erstelle einen neuen User Max" }],
    expected: "DB_QUERY",
    description: "Datenbank-Erstellung",
  },
  {
    name: "Bestätigung nach DB-Vorschlag",
    messages: [
      { role: "assistant", content: "Soll ich alle Benutzer aus der Datenbank abfragen?" },
      { role: "user", content: "ok mach das" },
    ],
    expected: "DB_QUERY",
    description: "Bestätigung nach DB-Angebot",
  },
  {
    name: "Rollen abfragen",
    messages: [{ role: "user", content: "Welche Rollen gibt es?" }],
    expected: "DB_QUERY",
    description: "Datenbank-Abfrage mit Frageform",
  },

  // VISION-Szenarien
  {
    name: "Screenshot-Frage",
    messages: [{ role: "user", content: "Siehst du den Fehler?" }],
    expected: "VISION",
    description: "Direkte Screenshot-Frage",
  },
  {
    name: "Visuelle Analyse",
    messages: [{ role: "user", content: "Was ist auf dem Screenshot?" }],
    expected: "VISION",
    description: "Explizite Screenshot-Analyse",
  },
  {
    name: "Visuelle Beschreibung",
    messages: [{ role: "user", content: "Beschreibe was du siehst" }],
    expected: "VISION",
    description: "Visuelle Beschreibungsanfrage",
  },
]

/**
 * Führt alle Tests aus und gibt Statistik aus
 */
async function runTests(): Promise<void> {
  console.log("🧪 AI-Router Live-Tests\n")
  console.log(`Testing ${testScenarios.length} scenarios...\n`)

  const results: Array<{
    name: string
    expected: string
    actual: string
    passed: boolean
    description: string
  }> = []

  for (const scenario of testScenarios) {
    try {
      const actual = await routeWithAI(scenario.messages)
      const passed = actual === scenario.expected

      results.push({
        name: scenario.name,
        expected: scenario.expected,
        actual,
        passed,
        description: scenario.description,
      })

      const icon = passed ? "✅" : "❌"
      console.log(`${icon} ${scenario.name}`)
      console.log(`   Expected: ${scenario.expected}, Got: ${actual}`)
      if (!passed) {
        console.log(`   Description: ${scenario.description}`)
      }
      console.log()
    } catch (error) {
      console.error(`❌ ${scenario.name} - Error:`, error)
      results.push({
        name: scenario.name,
        expected: scenario.expected,
        actual: "ERROR",
        passed: false,
        description: scenario.description,
      })
    }
  }

  // Statistik
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const successRate = ((passed / results.length) * 100).toFixed(1)

  console.log("=".repeat(60))
  console.log("📊 STATISTIK")
  console.log("=".repeat(60))
  console.log(`Total: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${successRate}%`)
  console.log()

  // Fehler-Details
  if (failed > 0) {
    console.log("=".repeat(60))
    console.log("❌ FEHLER-DETAILS")
    console.log("=".repeat(60))
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`\n${r.name}`)
        console.log(`  Expected: ${r.expected}`)
        console.log(`  Got: ${r.actual}`)
        console.log(`  Description: ${r.description}`)
      })
  }

  // Kategorie-Breakdown
  console.log("\n" + "=".repeat(60))
  console.log("📋 KATEGORIE-BREAKDOWN")
  console.log("=".repeat(60))
  const categories = ["UI_ACTION", "DB_QUERY", "VISION", "CHAT"] as const
  categories.forEach((cat) => {
    const categoryResults = results.filter((r) => r.expected === cat)
    const categoryPassed = categoryResults.filter((r) => r.passed).length
    const categoryRate =
      categoryResults.length > 0
        ? ((categoryPassed / categoryResults.length) * 100).toFixed(1)
        : "0.0"
    console.log(`${cat}: ${categoryPassed}/${categoryResults.length} (${categoryRate}%)`)
  })

  // Exit-Code basierend auf Erfolgsrate
  if (parseFloat(successRate) < 80) {
    console.log("\n⚠️  Success rate below 80% - consider optimizing the prompt")
    process.exit(1)
  } else {
    console.log("\n✅ Success rate acceptable")
    process.exit(0)
  }
}

// Script ausführen
runTests().catch((error) => {
  console.error("Fatal error:", error)
  if (error instanceof Error && error.message.includes("OPENROUTER_API_KEY")) {
    console.error("\n⚠️  OPENROUTER_API_KEY nicht gefunden!")
    console.error("Bitte setze OPENROUTER_API_KEY in .env.local")
    console.error("Oder führe aus: pnpm pull-env")
  }
  process.exit(1)
})
