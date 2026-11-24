-- Add soft-delete column required by BaseOrgEntity to scans
ALTER TABLE scans
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;