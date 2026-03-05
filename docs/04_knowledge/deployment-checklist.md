# Deployment-Checkliste

## Pre-Deployment

- [ ] Lokaler Build erfolgreich: `pnpm run build`
- [ ] TypeScript-Fehler behoben: `pnpm run lint`
- [ ] Environment-Variablen in Vercel gesetzt: `npx vercel env ls`
- [ ] Proxy-Konfiguration korrekt (Next.js 16: `proxy.ts` mit `setAll()`)

## Deployment

- [ ] Code committed und gepusht: `git push`
- [ ] Production-Deployment gestartet: `npx vercel --prod --yes`
- [ ] Build erfolgreich (keine Fehler in Logs)

## Post-Deployment

- [ ] Production-URL getestet
- [ ] Logs auf Fehler geprüft: `npx vercel logs <url>`
- [ ] Funktionen manuell getestet (Auth, Datenbank, etc.)

## Häufige Probleme

### Internal Server Error

1. Environment-Variablen prüfen: `npx vercel env ls`
2. Fehlende Variablen setzen: `echo "VALUE" | npx vercel env add NAME production`
3. Redeployen: `npx vercel --prod --yes`

### Cookie-Probleme

- Proxy verwendet `getAll()`/`setAll()` statt `get()`/`set()`/`remove()`
- Response muss bei jedem Cookie-Update verwendet werden
- Siehe `src/proxy.ts` für Referenz-Implementierung
- Siehe auch `docs/04_knowledge/deployment-guide.md` → "Next.js 16 Proxy Migration"

### Build-Fehler

- Regex ES2017-kompatibel machen (`[\s\S]` statt `/s` Flag)
- TypeScript Generics korrekt definieren
- ShadCN-Komponenten aktualisieren: `npx shadcn@latest add <component> --overwrite`
