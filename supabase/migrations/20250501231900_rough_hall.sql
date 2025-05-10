/*
  # Activity Logging System

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text)
      - `event_data` (jsonb)
      - `metadata` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add archiving functionality
*/

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS activity_logs_user_id_created_at_idx ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_event_type_idx ON activity_logs(event_type);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to archive old logs
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS void AS $$
BEGIN
  -- Move logs older than 90 days to archive table
  INSERT INTO activity_logs_archive
  SELECT *
  FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete archived logs from main table
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;