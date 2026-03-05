# Ebene 1: Governance

**Typ:** 🧠 Core (machine-readable)

## Zweck

Diese Ebene regelt _wie_ gearbeitet wird. Sie enthält verbindliche Regeln, Standards und Hygiene-Vorschriften.

## Inhalt

- **`.cursor/rules/`**: KI-Steuerungsregeln (siehe Root-Verzeichnis)
  - `prohibitions.mdc` - Nicht verhandelbare Verbote
  - `documentation.mdc` - TSDoc/JSDoc-Standards
  - `architecture.mdc` - Code-Stil und SOLID-Prinzipien
  - `testing.mdc` - Test-Patterns
  - `pr-review.mdc` - Code-Review-Anleitung

## Nutzung

Diese Dateien werden **automatisch** von KI-Tools (Cursor) geladen und angewendet. Sie sind Teil des Entwicklungsprozesses.

## Wartung

Änderungen an Governance-Regeln müssen über Pull Requests erfolgen und vom Team überprüft werden.
