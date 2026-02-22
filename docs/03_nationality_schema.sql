-- Add `nationality` column to the `profiles` table
-- This will store a string combining the emoji flag and country name (e.g., '🇮🇹 Italy')
ALTER TABLE profiles ADD COLUMN nationality TEXT;
