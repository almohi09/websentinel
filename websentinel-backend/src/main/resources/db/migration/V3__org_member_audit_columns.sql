-- Add audit/soft-delete columns required by BaseOrgEntity to organization_members
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;