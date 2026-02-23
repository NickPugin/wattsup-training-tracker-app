-- 04_strava_integration_schema.sql
-- Migration to add Strava integration support to WattsUp.

-- 1. Update the profiles table to store Strava OAuth credentials
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS strava_athlete_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS strava_access_token TEXT,
ADD COLUMN IF NOT EXISTS strava_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS strava_token_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Update the sessions table to track imported Strava activities
-- This prevents the auto-sync webhook from duplicating identical rides
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT UNIQUE;

-- We already have start_date, duration_minutes, and average_watts in the current sessions table.
-- The existing fields are:
-- user_id UUID
-- date (using this as start_date)
-- duration_minutes
-- average_watts
-- energy_kwh
