/*
  # Add Sleep Records Table

  1. New Tables
    - `sleep_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text - 'nap' or 'night')
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `duration` (integer, in minutes)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own records
*/

CREATE TABLE IF NOT EXISTS sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('nap', 'night')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer CHECK (duration IS NULL OR duration > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

-- Create policies for sleep records
CREATE POLICY "Users can create own sleep records"
  ON sleep_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sleep records"
  ON sleep_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep records"
  ON sleep_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX sleep_records_user_id_start_time_idx ON sleep_records(user_id, start_time DESC);