/*
  # Add Reminders Table

  1. New Tables
    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text - feeding, sleep, medication, appointment)
      - `title` (text)
      - `body` (text)
      - `time` (timestamptz)
      - `repeat` (text - none, daily, weekly)
      - `enabled` (boolean)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('feeding', 'sleep', 'medication', 'appointment')),
  title text NOT NULL,
  body text NOT NULL,
  time timestamptz NOT NULL,
  repeat text CHECK (repeat IN ('none', 'daily', 'weekly')),
  enabled boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS reminders_type_enabled_idx ON reminders(type, enabled);
CREATE INDEX IF NOT EXISTS reminders_user_id_time_idx ON reminders(user_id, time);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies with DO blocks to handle existing policies
DO $$ BEGIN
  CREATE POLICY "Users can create own reminders"
    ON reminders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own reminders"
    ON reminders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own reminders"
    ON reminders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own reminders"
    ON reminders
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$ BEGIN
  CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;