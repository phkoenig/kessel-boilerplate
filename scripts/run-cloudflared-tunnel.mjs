#!/usr/bin/env node

/**
 * Startet nur den Cloudflare Named Tunnel (ohne Next.js).
 * Tunnel-Name kommt aus scripts/dev-public-origin.json oder
 * env CLOUDFLARED_TUNNEL_NAME.
 *
 * Erst-Setup pro Projekt: `pnpm dev:setup-tunnel`
 */

import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(resolve(__dirname, "dev-public-origin.json"), "utf-8"))

if (config._status !== "ready") {
  process.stderr.write(
    "[dev:tunnel] scripts/dev-public-origin.json ist noch nicht initialisiert.\n" +
      "             Bitte zuerst: pnpm dev:setup-tunnel\n"
  )
  process.exit(1)
}

if (typeof config.cloudflaredTunnelName !== "string") {
  throw new Error("dev-public-origin.json: cloudflaredTunnelName fehlt oder ungueltig")
}
const tunnelName = process.env.CLOUDFLARED_TUNNEL_NAME?.trim() || config.cloudflaredTunnelName

const child = spawn("cloudflared", ["tunnel", "run", tunnelName], {
  stdio: "inherit",
  env: { ...process.env },
})

child.on("exit", (code, signal) => {
  if (signal) process.exit(130)
  process.exit(code ?? 1)
})
