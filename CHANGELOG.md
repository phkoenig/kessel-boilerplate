# Changelog - Template Repository

Alle wichtigen Änderungen an diesem Template werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [1.4.0] - 2025-11-14

### Added

- **Vercel-Integration:** Vollständige "Tag Null"-Integration mit automatischer Vercel-Verknüpfung
- **E2E-Tests:** Playwright-Konfiguration für End-to-End-Tests
- **GitHub Actions:** E2E-Test-Gating-Mechanismus für Pull Requests
- **Dokumentation:** Vollständige Deployment-Anleitung (`docs/DEPLOYMENT.md`)
- **Playwright Scripts:** `test:e2e` und `test:e2e:ui` Scripts in package.json
- **Playwright Dependency:** `@playwright/test` hinzugefügt

### Changed

- **.gitignore:** Playwright-spezifische Einträge hinzugefügt (test-results/, playwright-report/, playwright/.cache/)

## [1.3.0] - 2025-11-13

### Added

- **Pre-Commit Hook:** Dokumentationsstruktur-Validierung mit husky
- **Lint-Staged:** Automatische Code-Formatierung vor Commit

## [1.2.0] - 2025-01-15

### Fixed

- Bootstrapping-Problem: CLI erstellt nun `.env` UND `.env.local`
- Sicherheitslücke: REVOKE-Statements für Vault-Funktionen hinzugefügt

### Added

- 7-Ebenen-Dokumentationsarchitektur
- Vollständige Cursor-Regeln (5 MDC-Dateien)

## [1.1.0] - 2025-01-10

### Added

- Fail-Fast Validierung für Secrets
- TweakCN Theming-Unterstützung

## [1.0.0] - 2025-01-01

### Added

- Initiales Template-Release
- Next.js 15, Supabase, shadcn/ui Setup
