/*
  # Create sleep sessions table

  1. New Tables
    - `sleep_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text, either 'nap' or 'night')
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, optional)
      - `duration` (integer, must be positive if set)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS
    - Add policies for creating, reading, and updating sleep sessions
*/

CREATE TABLE IF NOT EXISTS sleep_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('nap', 'night')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer CHECK (duration IS NULL OR duration > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can create sleep sessions"
    ON sleep_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own sleep sessions"
    ON sleep_sessions
    FOR SELECT
    TO authenticated
    USING ((auth.uid() = user_id) OR (auth.role() = 'service_role'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own sleep sessions"
    ON sleep_sessions
    FOR UPDATE
    TO authenticated
    USING ((auth.uid() = user_id) OR (auth.role() = 'service_role'))
    WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;