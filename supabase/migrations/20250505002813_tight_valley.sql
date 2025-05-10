/*
  # Fix Sleep Records Table

  1. Changes
    - Drop and recreate sleep_records table
    - Add proper constraints and indexes
    - Set up RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing table and its dependencies
DROP TABLE IF EXISTS sleep_records CASCADE;

-- Create sleep_records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('nap', 'night')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer,
  created_at timestamptz DEFAULT now(),
  -- Add duration validation as a separate named constraint
  CONSTRAINT valid_duration CHECK (
    (end_time IS NULL AND duration IS NULL) OR
    (end_time IS NOT NULL AND duration > 0)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS sleep_records_user_id_idx ON sleep_records(user_id);
CREATE INDEX IF NOT EXISTS sleep_records_start_time_idx ON sleep_records(start_time DESC);
CREATE INDEX IF NOT EXISTS sleep_records_type_idx ON sleep_records(type);

-- Enable RLS
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  CREATE POLICY "Users can create own sleep records"
    ON sleep_records
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own sleep records"
    ON sleep_records
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own sleep records"
    ON sleep_records
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own sleep records"
    ON sleep_records
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;