/*
  # Activity Tracking System

  1. New Tables
    - activities
      - Core activity tracking table
      - Stores all user activities with metadata
      - Supports real-time tracking and reporting
    - activity_locations
      - Stores location data for activities
      - Optional association with activities
    - activity_measurements
      - Stores measurements related to activities
      - Flexible schema for different measurement types

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure data isolation between users

  3. Changes
    - Create activities table with comprehensive tracking
    - Add location tracking support
    - Add measurement tracking support
    - Set up proper indexing for performance
*/

-- Create enum for activity types
CREATE TYPE activity_type AS ENUM (
  'sleep',
  'nap',
  'feeding',
  'diaper_change',
  'medication',
  'temperature',
  'growth',
  'milestone',
  'other'
);

-- Create enum for activity status
CREATE TYPE activity_status AS ENUM (
  'in_progress',
  'completed',
  'cancelled'
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type activity_type NOT NULL,
  status activity_status NOT NULL DEFAULT 'in_progress',
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration interval GENERATED ALWAYS AS (end_time - start_time) STORED,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create activity_locations table
CREATE TABLE IF NOT EXISTS activity_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  accuracy numeric(10,2),
  altitude numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create activity_measurements table
CREATE TABLE IF NOT EXISTS activity_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  measurement_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS activities_user_id_type_idx ON activities(user_id, type);
CREATE INDEX IF NOT EXISTS activities_user_id_status_idx ON activities(user_id, status);
CREATE INDEX IF NOT EXISTS activities_user_id_start_time_idx ON activities(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS activity_locations_activity_id_idx ON activity_locations(activity_id);
CREATE INDEX IF NOT EXISTS activity_measurements_activity_id_idx ON activity_measurements(activity_id);

-- Enable RLS on all tables
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_measurements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activities
CREATE POLICY "Users can create own activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for activity_locations
CREATE POLICY "Users can create locations for own activities"
  ON activity_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view locations for own activities"
  ON activity_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id
      AND user_id = auth.uid()
    )
  );

-- Create RLS policies for activity_measurements
CREATE POLICY "Users can create measurements for own activities"
  ON activity_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view measurements for own activities"
  ON activity_measurements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id
      AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate duration when activity is completed
CREATE OR REPLACE FUNCTION calculate_activity_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.end_time IS NULL THEN
    NEW.end_time = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically calculate duration
CREATE TRIGGER calculate_activity_duration_trigger
  BEFORE UPDATE ON activities
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.end_time IS NULL)
  EXECUTE FUNCTION calculate_activity_duration();