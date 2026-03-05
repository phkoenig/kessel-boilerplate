# Rollout Test-Matrix (Boilerplate 2.0)

## Unit-Tests

| Suite                     | Befehl                             | Status         |
| ------------------------- | ---------------------------------- | -------------- |
| Realtime Mock-Adapter     | `pnpm test:run src/lib/realtime`   | ✅             |
| Navigation Code-Generator | `pnpm test:run src/lib/navigation` | ✅             |
| AI Tool Registry          | `pnpm test:run src/lib/ai`         | Manuell prüfen |
| Auth Guards               | (in API-Integration)               | ✅             |

## API-Route Klassifizierung

| Kategorie   | Beispiele                                  | Guard               |
| ----------- | ------------------------------------------ | ------------------- |
| Protected   | app-settings, themes/list                  | requireAuth         |
| Admin       | admin/\*, themes/delete, navigation/update | requireAdmin        |
| Public      | content/\*, webhooks/clerk                 | Signatur/keine Auth |
| Development | debug/_, dev/_                             | NODE_ENV + Auth     |

Vollständig: `docs/02_architecture/api-route-classification.md`

## E2E Smoke-Flows

- [ ] Login → Shell sichtbar
- [ ] Logout → Redirect zu /login
- [ ] Chat-Panel öffnen/schließen
- [ ] Write-Tool im Chat → router.refresh (kein Full-Reload)
- [ ] Admin-Route ohne Auth → 401
- [ ] Theme-Liste mit Auth → 200

## kessel-cli

- [ ] `kessel init <name>` – Golden Path
- [ ] Preset-Resolution: `node tests/preset-resolution.test.mjs`
- [ ] Template klonen – phkoenig/kessel-boilerplate

## Rollout-Stufen

1. **Intern** – Eigenes Team, Staging
2. **Pilot** – 1–2 ausgewählte Projekte
3. **Default** – Alle neuen Ableitungen nutzen clerk-spacetimedb-ui
