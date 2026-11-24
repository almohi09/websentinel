-- Add verification token column for ownership verification (Module 3)
ALTER TABLE websites
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64);