#!/usr/bin/env node

/**
 * Erst-Setup fuer die HTTPS-Dev-Subdomain via Cloudflare Named Tunnel.
 *
 * Macht:
 *   1. Slug + Port erfragen (Defaults aus package.json + Allokationsliste)
 *   2. Cloudflared-Voraussetzungen pruefen (PATH, cert.pem)
 *   3. `cloudflared tunnel create <slug>-dev` -> UUID extrahieren
 *   4. `cloudflared tunnel route dns --overwrite-dns <UUID> <slug>-dev.megabrain.cloud`
 *   5. scripts/dev-public-origin.json mit finalen Werten + _status: "ready" schreiben
 *   6. Falls noetig: package.json `dev` Script auf -p <port> pinnen
 *
 * Idempotent: wenn _status === "ready" laeuft erst die Bestaetigungsfrage.
 *
 * Flags:
 *   --dry-run   nur ausgeben was passieren wuerde, keine Aenderungen
 *   --slug=X    Slug nicht interaktiv erfragen
 *   --port=N    Port nicht interaktiv erfragen
 *   --yes       alle Abfragen mit Default beantworten
 *
 * Doku: docs/02_architecture/dev-https-subdomain.md
 */

import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { homedir, platform } from "node:os"
import { dirname, resolve, join } from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const configPath = resolve(__dirname, "dev-public-origin.json")
const packageJsonPath = resolve(repoRoot, "package.json")

const args = parseArgs(process.argv.slice(2))
const dryRun = Boolean(args["dry-run"])
const yes = Boolean(args.yes)

const ZONE = "megabrain.cloud"

main().catch((err) => {
  process.stderr.write(`\n[setup-tunnel] FEHLER: ${err.message ?? err}\n`)
  process.exit(1)
})

async function main() {
  banner()
  const rl = createInterface({ input, output })

  try {
    const existingConfig = readConfigSafe()
    if (existingConfig?._status === "ready") {
      const answer = await ask(
        rl,
        `[setup-tunnel] Subdomain ist bereits eingerichtet (${existingConfig.publicHttpsOrigin}). Neu setupen? [y/N] `,
        "n"
      )
      if (!/^y(es)?$/i.test(answer.trim())) {
        say("Abgebrochen — bestehende Konfiguration unveraendert.")
        return
      }
    }

    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
    const defaultSlug = sanitizeSlug(args.slug || pkg.name || "myapp")
    const slug = args.slug
      ? sanitizeSlug(args.slug)
      : yes
        ? defaultSlug
        : sanitizeSlug(await ask(rl, `Projekt-Slug [${defaultSlug}]: `, defaultSlug))

    const defaultPort = String(args.port || existingConfig?.localDevPort || 3000)
    const port = args.port
      ? Number(args.port)
      : yes
        ? Number(defaultPort)
        : Number(await ask(rl, `Lokaler Dev-Port [${defaultPort}]: `, defaultPort))

    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      throw new Error(`Ungueltiger Port: ${port}`)
    }

    const hostname = `${slug}-dev.${ZONE}`
    const httpsOrigin = `https://${hostname}`
    const tunnelName = `${slug}-dev`

    say("")
    say(`Plan:`)
    say(`  Slug:     ${slug}`)
    say(`  Port:     ${port}`)
    say(`  Hostname: ${hostname}`)
    say(`  Tunnel:   ${tunnelName}`)
    say("")

    if (!yes) {
      const ok = await ask(rl, "Fortfahren? [Y/n] ", "y")
      if (/^n/i.test(ok.trim())) {
        say("Abgebrochen.")
        return
      }
    }

    checkCloudflaredAvailable()
    checkCertPem()

    const uuid = createOrReuseTunnel(tunnelName)
    routeDns(uuid, hostname)

    const newConfig = {
      _status: "ready",
      publicHostname: hostname,
      publicHttpsOrigin: httpsOrigin,
      localDevPort: port,
      cloudflaredTunnelName: tunnelName,
      cloudflaredTunnelId: uuid,
    }

    if (dryRun) {
      say("\n[dry-run] Wuerde scripts/dev-public-origin.json schreiben:")
      say(JSON.stringify(newConfig, null, 2))
    } else {
      writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + "\n")
      say(`\n[setup-tunnel] scripts/dev-public-origin.json aktualisiert.`)
    }

    pinDevPortInPackageJson(port, dryRun)

    say("")
    say("✓ Setup fertig.")
    say(`  Start:   pnpm dev:domain`)
    say(`  Browser: ${httpsOrigin}`)
    say("")
    say("Hinweis: Der Tunnel verbindet sich erst beim ersten `pnpm dev:domain`.")
  } finally {
    rl.close()
  }
}

function readConfigSafe() {
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"))
  } catch {
    return null
  }
}

function sanitizeSlug(raw) {
  const s = String(raw)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
  if (!s) throw new Error("Slug darf nicht leer sein")
  if (s.endsWith("-dev")) {
    return s.slice(0, -4) // user gave "foo-dev", we add suffix later
  }
  return s
}

function checkCloudflaredAvailable() {
  const probe = spawnSync("cloudflared", ["--version"], { encoding: "utf-8" })
  if (probe.status !== 0) {
    const installHint =
      platform() === "win32"
        ? "  winget install --id Cloudflare.cloudflared"
        : "  Siehe https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    throw new Error(
      `cloudflared ist nicht im PATH oder antwortet nicht.\n` +
        `Installation:\n${installHint}\n` +
        `Anschliessend: cloudflared tunnel login`
    )
  }
}

function checkCertPem() {
  const certPath = join(homedir(), ".cloudflared", "cert.pem")
  if (!existsSync(certPath)) {
    throw new Error(
      `Origin-Certificate fehlt: ${certPath}\n` +
        `Bitte einmalig: cloudflared tunnel login\n` +
        `(Browser-Flow autorisiert die Zone megabrain.cloud — gilt fuer alle Projekte unter dieser Zone)`
    )
  }
}

function createOrReuseTunnel(tunnelName) {
  const existing = listTunnels().find((t) => t.name === tunnelName)
  if (existing) {
    say(
      `[setup-tunnel] Tunnel "${tunnelName}" existiert bereits (UUID ${existing.id}) — wiederverwenden.`
    )
    return existing.id
  }

  if (dryRun) {
    say(`[dry-run] Wuerde anlegen: cloudflared tunnel create ${tunnelName}`)
    return "00000000-0000-0000-0000-000000000000"
  }

  const result = spawnSync("cloudflared", ["tunnel", "create", tunnelName], { encoding: "utf-8" })
  if (result.status !== 0) {
    throw new Error(`cloudflared tunnel create fehlgeschlagen:\n${result.stdout}\n${result.stderr}`)
  }
  const stdout = result.stdout + result.stderr
  const match = stdout.match(/Created tunnel\s+\S+\s+with id\s+([0-9a-f-]{36})/i)
  if (!match) {
    throw new Error(
      `Konnte UUID des neuen Tunnels nicht parsen aus:\n${stdout}\nBitte manuell pruefen.`
    )
  }
  const uuid = match[1]
  say(`[setup-tunnel] Tunnel "${tunnelName}" angelegt (UUID ${uuid}).`)
  return uuid
}

function listTunnels() {
  const result = spawnSync("cloudflared", ["tunnel", "list"], { encoding: "utf-8" })
  if (result.status !== 0) return []
  const lines = result.stdout.split(/\r?\n/).slice(1)
  const tunnels = []
  for (const line of lines) {
    const m = line.match(/^([0-9a-f-]{36})\s+(\S+)/i)
    if (m) tunnels.push({ id: m[1], name: m[2] })
  }
  return tunnels
}

function routeDns(uuid, hostname) {
  if (dryRun) {
    say(`[dry-run] Wuerde routen: cloudflared tunnel route dns --overwrite-dns ${uuid} ${hostname}`)
    return
  }
  const result = spawnSync(
    "cloudflared",
    ["tunnel", "route", "dns", "--overwrite-dns", uuid, hostname],
    { encoding: "utf-8" }
  )
  if (result.status !== 0) {
    throw new Error(
      `cloudflared tunnel route dns fehlgeschlagen:\n${result.stdout}\n${result.stderr}`
    )
  }
  say(`[setup-tunnel] CNAME ${hostname} -> Tunnel ${uuid} eingerichtet.`)
}

function pinDevPortInPackageJson(port, dry) {
  const raw = readFileSync(packageJsonPath, "utf-8")
  const pkg = JSON.parse(raw)
  if (!pkg.scripts || typeof pkg.scripts !== "object") return
  let changed = false

  for (const key of ["dev", "dev:secrets"]) {
    const cmd = pkg.scripts[key]
    if (typeof cmd !== "string") continue
    if (!cmd.includes("next dev")) continue
    const portFlagRe = /\s+(?:-p|--port)\s+\d+/
    let updated
    if (portFlagRe.test(cmd)) {
      updated = cmd.replace(portFlagRe, ` -p ${port}`)
    } else {
      updated = `${cmd} -p ${port}`
    }
    if (updated !== cmd) {
      pkg.scripts[key] = updated
      changed = true
    }
  }

  if (!changed) return
  if (dry) {
    say(`[dry-run] Wuerde package.json scripts.dev / scripts.dev:secrets auf -p ${port} pinnen.`)
    return
  }
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n")
  say(`[setup-tunnel] package.json: dev / dev:secrets auf -p ${port} gepinnt.`)
}

function parseArgs(argv) {
  const out = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) out[m[1]] = m[2] === undefined ? true : m[2]
  }
  return out
}

async function ask(rl, question, fallback) {
  const answer = await rl.question(question)
  return answer.trim() || fallback
}

function say(line) {
  process.stdout.write(`${line}\n`)
}

function banner() {
  say("")
  say("=== HTTPS-Dev-Subdomain Setup (Cloudflare Tunnel) ===")
  say("Doku: docs/02_architecture/dev-https-subdomain.md")
  if (dryRun) say("Mode: --dry-run (keine Aenderungen)")
  say("")
}
