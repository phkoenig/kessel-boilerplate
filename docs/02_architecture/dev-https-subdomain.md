# Lokale Entwicklung mit fester HTTPS-Dev-Subdomain

> **Diese Datei ist die SSOT** fuer das HTTPS-Dev-Subdomain-Setup aller
> Projekte, die aus diesem Boilerplate abgeleitet sind. Andere Repos
> spiegeln nur Auszuege und verweisen hierher.

## Warum

Clerk, OAuth, Webhooks, Service-Worker und Embedded-Previews funktionieren
auf `http://localhost:<port>` unzuverlaessig (cross-site cookies, Origin-Pruefungen,
fehlendes HTTPS). Loesung: pro Projekt eine **stabile HTTPS-Subdomain** unter
`*.megabrain.cloud`, gehostet via **Cloudflare Named Tunnel**, der auf
`http://localhost:<port>` zoennt.

```
Browser ──https──▶ Cloudflare Edge ──tunnel──▶ cloudflared (lokal) ──http──▶ Next.js
```

Vorteile: kein Firewall-Loch, gueltiges Cert, eigene Subdomain pro Projekt,
beliebig viele Projekte parallel ohne Port-Kollisionen.

## TL;DR fuer neue Projekte

```bash
# Einmalig pro Maschine
winget install --id Cloudflare.cloudflared   # Windows
cloudflared tunnel login                     # Browser-Flow, schreibt ~/.cloudflared/cert.pem

# Pro Projekt einmalig
pnpm dev:setup-tunnel                        # interaktiver Wizard

# Ab jetzt taeglich
pnpm pull-env
pnpm dev:domain                              # Next + Cloudflare Tunnel in einem Befehl
```

Browser dann unter der HTTPS-URL aus `scripts/dev-public-origin.json` oeffnen,
**nicht** `localhost`.

## Master-Allokationsliste (SSOT)

Pro Projekt **fester Port** + **eigene Subdomain** + **eigener Tunnel**.
Alle Projekte unter Cloudflare-Zone `megabrain.cloud`. Cert.pem ist
account-weit nutzbar.

| Projekt         | Port   | Tunnel-Name         | Subdomain                           | Tunnel-UUID                            |
| --------------- | ------ | ------------------- | ----------------------------------- | -------------------------------------- |
| `market-magnet` | `3010` | `market-magnet-dev` | `market-magnet-dev.megabrain.cloud` | `a8a259f8-7522-40c4-8cbe-9142d31d2da9` |
| `iryse`         | `3020` | `iryse-dev`         | `iryse-dev.megabrain.cloud`         | `97d1da46-d759-492c-992e-cee6ea7d7ae1` |
| `portal`        | `3030` | `portal-dev`        | `portal-dev.megabrain.cloud`        | `0194cdd0-cd50-4f98-8733-b94f720bb41c` |
| `ter`           | `3040` | `ter-dev`           | `ter-dev.megabrain.cloud`           | `12aaf67d-3529-4388-b032-e73b4151d814` |
| `baass`         | `3050` | `baass-dev`         | `baass-dev.megabrain.cloud`         | `d316cb69-ce1a-489a-a2a4-b37e5dcd8d20` |

**Naechste freie Slots:** Port `3060`, `3070`, `3080`, … — der Wizard schlaegt
beim Setup automatisch den naechsten freien Wert vor (sofern als Argument
nichts vorgegeben ist).

> **Pflicht:** Nach jedem Setup eines neuen Projekts diese Tabelle hier im
> Boilerplate-Repo nachziehen (PR oder direkter Commit). Mirror in
> `market-magnet/docs/02_architecture/dev-https-subdomain.md` automatisch
> nachpflegen, wenn dort referenziert.

## Single Source of Truth pro Projekt

| Feld                                    | Quelle                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Hostname, Port, Tunnel-Name, UUID       | [`scripts/dev-public-origin.json`](../../scripts/dev-public-origin.json)                                           |
| Cross-Origin-Whitelist fuer Next.js Dev | [`next.config.ts`](../../next.config.ts) → `allowedDevOrigins` (defensiv: leer wenn JSON `_status: uninitialized`) |
| Orchestrierung Next + cloudflared       | [`scripts/dev-with-domain.mjs`](../../scripts/dev-with-domain.mjs)                                                 |
| Nur Tunnel (Next laeuft separat)        | [`scripts/run-cloudflared-tunnel.mjs`](../../scripts/run-cloudflared-tunnel.mjs)                                   |
| Setup-Wizard                            | [`scripts/setup-dev-https-subdomain.mjs`](../../scripts/setup-dev-https-subdomain.mjs)                             |

## Wizard-Optionen

```bash
pnpm dev:setup-tunnel                          # interaktiv
pnpm dev:setup-tunnel --dry-run                # nur Plan ausgeben, nichts aendern
pnpm dev:setup-tunnel --slug=foo --port=3060   # nicht interaktiv
pnpm dev:setup-tunnel --slug=foo --port=3060 --yes  # alles ohne Rueckfrage
```

Der Wizard ist **idempotent**: bei bereits initialisiertem `_status: ready`
fragt er erst, ob neu setupen. Existiert der Tunnel-Name in Cloudflare schon,
wird er wiederverwendet (kein Duplikat).

Was der Wizard macht:

1. Slug + Port erfragen (Defaults aus `package.json` + `dev-public-origin.json`)
2. Cloudflared im PATH und `~/.cloudflared/cert.pem` pruefen
3. `cloudflared tunnel create <slug>-dev` (oder existierenden wiederverwenden)
4. `cloudflared tunnel route dns --overwrite-dns <UUID> <slug>-dev.megabrain.cloud`
5. `scripts/dev-public-origin.json` mit finalen Werten + `_status: "ready"` schreiben
6. `package.json` Scripts `dev` / `dev:secrets` auf `-p <port>` pinnen, falls noetig

## Manuelles Cookbook (ohne Wizard)

```bash
# 1. Tunnel + DNS anlegen (cert.pem aus ~/.cloudflared wird genutzt)
cloudflared tunnel create <projekt>-dev
# UUID aus Output notieren, dann (per UUID, nicht per Name — siehe Stolperfalle):
cloudflared tunnel route dns --overwrite-dns <UUID> <projekt>-dev.megabrain.cloud

# 2. scripts/dev-public-origin.json haendisch fuellen, _status auf "ready" setzen.
#    publicHostname: "<projekt>-dev.megabrain.cloud"
#    publicHttpsOrigin: "https://<projekt>-dev.megabrain.cloud"
#    localDevPort: <freier Slot>
#    cloudflaredTunnelName: "<projekt>-dev"
#    cloudflaredTunnelId: "<UUID>"

# 3. package.json scripts.dev / scripts.dev:secrets ggf. auf -p <port> pinnen.

# 4. Allokationstabelle in dieser Datei (Boilerplate-Repo) ergaenzen.
```

## Voraussetzungen (einmalig pro Maschine)

1. **Cloudflare-Konto** mit Zone `megabrain.cloud` (DNS auf Cloudflare gehostet,
   Nameserver bei Registrar `ainsley.ns.cloudflare.com` + `ed.ns.cloudflare.com`).
2. **`cloudflared`** im `PATH`. Windows: `winget install --id Cloudflare.cloudflared`.
3. **Origin-Certificate** authorisieren — einmalig:

   ```bash
   cloudflared tunnel login
   ```

   Schreibt `~/.cloudflared/cert.pem`. Diese Datei ist **fuer ALLE Projekte**
   unter `megabrain.cloud` nutzbar — kein Re-Login pro Projekt noetig.

## Stolperfallen / Lessons Learned

### 1. cloudflared CLI v2025.x DNS-Route-Bug

`cloudflared tunnel route dns <NAME> <hostname>` bindet die Route immer an
den **zuerst angelegten** Tunnel im Account, nicht an den genannten.
**Immer per UUID routen** und `--overwrite-dns` setzen. Der Wizard macht
das von selbst.

### 2. Universal SSL nur eine Subdomain-Ebene

`market-magnet.dev.megabrain.cloud` braucht Advanced Certificate Manager
(kostenpflichtig). Daher **immer** flach: `<projekt>-dev.megabrain.cloud`.
Der Wizard erzwingt das.

### 3. EADDRINUSE nach Crash

Wenn der Wrapper hart gekillt wird, bleibt Next.js manchmal als Orphan
auf dem Port. Auf Windows:

```powershell
netstat -ano | findstr <PORT>
Stop-Process -Id <PID> -Force
```

### 4. Clerk Dashboard

Dev-Instances brauchen **kein** Allowed-Origins-Setting (Dev-Cookies laufen
auf `*.clerk.accounts.dev`, sind permissiv). **Live-Instances** schon — dort
die Production-URL eintragen.

### 5. Port-Kollisionen mit Boilerplate-Default 3000

`pnpm dev` lief frueher auf 3000. Der Wizard pinnt automatisch auf den
gewaehlten Port — Kollisionen mit anderen lokal laufenden Projekten
ausgeschlossen.

## Was wir gemacht und warum (Setup-Historie)

Vollstaendige Roll-out-Geschichte (Cloudflare-Migration von Vercel-DNS,
IONOS-Nameserver-Wechsel, SSL-Pitfalls): siehe Mirror in
`market-magnet/docs/04_knowledge/dev-https-subdomain-rollout.md`. Die
Geschichte gehoert dort hin, weil market-magnet das Pilot-Projekt war.
