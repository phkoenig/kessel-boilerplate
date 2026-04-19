# Rollout Test-Matrix (Boilerplate 3.0)

## Unit-Tests

| Suite                     | Befehl                                 | Status         |
| ------------------------- | -------------------------------------- | -------------- |
| Realtime Hybrid-Adapter   | `pnpm test:run src/lib/realtime`       | Neu fuer 3.0   |
| Core Runtime Mode         | `pnpm test:run src/lib/core/__tests__` | Neu fuer 3.0   |
| Navigation Code-Generator | `pnpm test:run src/lib/navigation`     | ✅             |
| AI Tool Registry          | `pnpm test:run src/lib/ai`             | Manuell prüfen |
| Auth Guards               | `pnpm test:run src/lib/auth`           | Manuell prüfen |

## API-Route Klassifizierung

| Kategorie   | Beispiele                                   | Guard               |
| ----------- | ------------------------------------------- | ------------------- |
| Protected   | app-settings, themes/list, core/permissions | requireAuth         |
| Admin       | admin/\*, themes/delete                     | requireAdmin        |
| Public      | content/\*, webhooks/clerk                  | Signatur/keine Auth |
| Development | debug/_, dev/_                              | NODE_ENV + Auth     |

Vollständig: `docs/02_architecture/api-route-classification.md`

## E2E Smoke-Flows

- [ ] Login → Shell sichtbar
- [ ] Logout → Redirect zu /login
- [ ] Chat-Panel öffnen/schließen
- [ ] Write-Tool im Chat → Realtime/Invalidate ohne Voll-Reload
- [ ] Admin-Route ohne Auth → 401
- [ ] Theme-Liste mit Auth → 200
- [ ] App-Settings kommen ueber Core-Abstraktion
- [ ] Theme-Persistenz ueber Core-Route bleibt nach Reload erhalten
- [ ] Tenant-Branding bleibt pro Ableitung isoliert

## kessel-cli

- [ ] `kessel init <name>` – Golden Path mit `op` CLI
- [ ] Preset-Resolution: `node tests/preset-resolution.test.mjs`
- [ ] Template klonen – phkoenig/kessel-boilerplate
- [ ] `pnpm pull-env` zieht Secrets aus 1Password

## Rollout-Stufen

1. **Intern** – Hybridmodus gegen Legacy-Store validieren
2. **Pilot** – erste Ableitungen mit 1Password + Core-Abstraktion
3. **Default** – alle neuen Ableitungen nutzen Boilerplate 3.0
