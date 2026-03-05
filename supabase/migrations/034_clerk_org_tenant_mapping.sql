-- Migration: Clerk Organization -> Tenant Mapping
--
-- Ermoeglicht Multi-Tenancy mit Clerk Organizations.
-- Mapping: clerk_org_id (Clerk Organization ID) -> app.tenants.id

-- 1. clerk_org_id auf app.tenants
ALTER TABLE app.tenants
ADD COLUMN IF NOT EXISTS clerk_org_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_tenants_clerk_org_id
ON app.tenants(clerk_org_id)
WHERE clerk_org_id IS NOT NULL;

COMMENT ON COLUMN app.tenants.clerk_org_id IS 'Clerk Organization ID (org_xxx). NULL = manuell angelegter Tenant.';
