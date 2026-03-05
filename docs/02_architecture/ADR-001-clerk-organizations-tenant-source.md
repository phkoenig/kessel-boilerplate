# ADR-001: Clerk Organizations als Tenant Source of Truth

**Status:** Angenommen (Pre-Migration)  
**Datum:** 2025-03-05  
**Kontext:** Boilerplate 2.0 Upgrade

## Entscheidung

- **Clerk** übernimmt primär **Identity** und **Tenant-Quelle** (via Organizations).
- **Supabase** bleibt zentral für **Domain-Daten** und **Vault**.
- Tenant-Mapping: `clerk_org_id` -> Supabase `tenant_id` (1:1 oder definierte Zuordnung).

## Begründung

- Einheitliche Auth/Identity-Schicht über alle Ableitungen.
- Clerk Organizations bieten natives Multi-Tenancy ohne Eigenimplementierung.
- Supabase bleibt bewährter Daten- und Vault-Layer.
