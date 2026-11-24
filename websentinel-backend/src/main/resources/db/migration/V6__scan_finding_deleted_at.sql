-- Add soft-delete column required by BaseOrgEntity to scan_findings
ALTER TABLE scan_findings
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;