#!/usr/bin/env node

/**
 * Lokaler Dev-Stack mit fester oeffentlicher HTTPS-Origin:
 * - `pnpm dev` (Next.js auf dem Port aus scripts/dev-public-origin.json)
 * - Cloudflare Named Tunnel -> http://localhost:<port>
 *
 * Erst-Setup pro Projekt: `pnpm dev:setup-tunnel`
 * Tunnel-Override per env: CLOUDFLARED_TUNNEL_NAME
 *
 * Doku: docs/02_architecture/dev-https-subdomain.md
 */

import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const configPath = resolve(__dirname, "dev-public-origin.json")

const config = JSON.parse(readFileSync(configPath, "utf-8"))

if (config._status !== "ready") {
  process.stderr.write(
    "[dev:domain] scripts/dev-public-origin.json ist noch nicht initialisiert.\n" +
      "             Bitte zuerst: pnpm dev:setup-tunnel\n" +
      "             Anleitung: docs/02_architecture/dev-https-subdomain.md\n"
  )
  process.exit(1)
}

if (typeof config.cloudflaredTunnelName !== "string" || !config.cloudflaredTunnelName) {
  throw new Error("dev-public-origin.json: cloudflaredTunnelName fehlt")
}
const tunnelName = process.env.CLOUDFLARED_TUNNEL_NAME?.trim() || config.cloudflaredTunnelName

const isWindows = process.platform === "win32"
const pnpmCmd = isWindows ? "pnpm.cmd" : "pnpm"

const children = []

const devChild = spawn(pnpmCmd, ["dev"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
  shell: false,
})
children.push(devChild)

const cfChild = spawn("cloudflared", ["tunnel", "run", tunnelName], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
})
children.push(cfChild)

devChild.on("error", (err) => {
  process.stderr.write(`[dev:domain] pnpm dev konnte nicht gestartet werden: ${err.message}\n`)
  killAll("SIGTERM")
  process.exit(1)
})

cfChild.on("error", (err) => {
  process.stderr.write(
    `[dev:domain] cloudflared konnte nicht gestartet werden: ${err.message}\n` +
      "Ist cloudflared installiert und im PATH? Siehe docs/02_architecture/dev-https-subdomain.md\n"
  )
  killAll("SIGTERM")
  process.exit(1)
})

function killAll(signal) {
  for (const c of children) {
    if (!c.killed && c.exitCode === null) {
      c.kill(signal)
    }
  }
}

process.on("SIGINT", () => {
  killAll("SIGTERM")
  process.exit(130)
})
process.on("SIGTERM", () => killAll("SIGTERM"))

devChild.on("exit", (code, signal) => {
  if (signal === "SIGTERM") {
    killAll("SIGTERM")
    process.exit(130)
  }
  process.stderr.write(`[dev:domain] Next.js beendet (code=${code ?? "null"})\n`)
  killAll("SIGTERM")
  process.exit(code ?? 1)
})

cfChild.on("exit", (code, signal) => {
  if (signal === "SIGTERM") return
  process.stderr.write(
    `[dev:domain] cloudflared beendet (code=${code ?? "null"}), stoppe Next.js\n`
  )
  killAll("SIGTERM")
  process.exit(code ?? 1)
})
