-- Add split_mode to bills table for the new "honesty" mode
-- Existing bills default to 'equal' for backward compatibility
ALTER TABLE bills ADD COLUMN split_mode TEXT NOT NULL DEFAULT 'honesty';
