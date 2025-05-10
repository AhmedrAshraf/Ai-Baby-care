/*
  # Fix Database Schema

  1. Changes
    - Drop existing tables to avoid conflicts
    - Recreate tables with proper constraints
    - Add missing indexes
    - Update RLS policies
    
  2. Security
    - Enable RLS on all tables
    - Add proper policies for authenticated users
*/

-- Drop existing tables in correct order
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS pediatricians CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS activity_measurements CASCADE;
DROP TABLE IF EXISTS activity_locations CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS sleep_records CASCADE;
DROP TABLE IF EXISTS growth_measurements CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS activity_status CASCADE;
DROP TYPE IF EXISTS appointment_type CASCADE;

-- Create types
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

CREATE TYPE activity_status AS ENUM (
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE appointment_type AS ENUM (
  'checkup',
  'vaccination',
  'sick_visit',
  'follow_up',
  'other'
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  parent_name text NOT NULL,
  parent_due_date timestamptz,
  baby_name text NOT NULL,
  baby_birthday timestamptz NOT NULL,
  baby_gender text CHECK (baby_gender IN ('boy', 'girl')),
  baby_photo_url text,
  relationship_to_child text NOT NULL DEFAULT 'guardian',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT valid_relationship_types CHECK (
    relationship_to_child IN ('mother', 'father', 'guardian') OR 
    length(relationship_to_child) <= 50
  )
);

-- Create pediatricians table
CREATE TABLE IF NOT EXISTS pediatricians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  pediatrician_id uuid NOT NULL REFERENCES pediatricians(id),
  date timestamptz NOT NULL,
  type appointment_type NOT NULL,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reminders table
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
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

-- Create sleep_records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('nap', 'night')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer CHECK (duration IS NULL OR duration > 0),
  created_at timestamptz DEFAULT now()
);

-- Create growth_measurements table
CREATE TABLE IF NOT EXISTS growth_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  date timestamptz NOT NULL DEFAULT now(),
  weight numeric CHECK (weight > 0),
  weight_unit text CHECK (weight_unit IN ('kg', 'lb')),
  height numeric CHECK (height > 0),
  height_unit text CHECK (height_unit IN ('cm', 'in')),
  head_circumference numeric CHECK (head_circumference > 0),
  head_unit text CHECK (head_unit IN ('cm', 'in')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  interaction_type text NOT NULL CHECK (interaction_type IN ('message', 'command', 'response', 'error')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS pediatricians_user_id_idx ON pediatricians(user_id);
CREATE INDEX IF NOT EXISTS appointments_user_id_date_idx ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS appointments_pediatrician_id_idx ON appointments(pediatrician_id);
CREATE INDEX IF NOT EXISTS reminders_type_enabled_idx ON reminders(type, enabled);
CREATE INDEX IF NOT EXISTS reminders_user_id_time_idx ON reminders(user_id, time);
CREATE INDEX IF NOT EXISTS activities_user_id_type_idx ON activities(user_id, type);
CREATE INDEX IF NOT EXISTS activities_user_id_status_idx ON activities(user_id, status);
CREATE INDEX IF NOT EXISTS activities_user_id_start_time_idx ON activities(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS activity_locations_activity_id_idx ON activity_locations(activity_id);
CREATE INDEX IF NOT EXISTS activity_measurements_activity_id_idx ON activity_measurements(activity_id);
CREATE INDEX IF NOT EXISTS sleep_records_user_id_start_time_idx ON sleep_records(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS growth_measurements_user_id_date_idx ON growth_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS conversations_interaction_type_idx ON conversations(interaction_type);
CREATE INDEX IF NOT EXISTS conversations_user_id_created_at_idx ON conversations(user_id, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pediatricians ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
  -- User Profiles
  CREATE POLICY "Users can create own profile"
    ON user_profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Pediatricians
  CREATE POLICY "Users can create own pediatricians"
    ON pediatricians FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view own pediatricians"
    ON pediatricians FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own pediatricians"
    ON pediatricians FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Appointments
  CREATE POLICY "Users can create own appointments"
    ON appointments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view own appointments"
    ON appointments FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own appointments"
    ON appointments FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Reminders
  CREATE POLICY "Users can create own reminders"
    ON reminders FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can read own reminders"
    ON reminders FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete own reminders"
    ON reminders FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

  -- Activities
  CREATE POLICY "Users can create own activities"
    ON activities FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view own activities"
    ON activities FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own activities"
    ON activities FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Activity Locations
  CREATE POLICY "Users can create locations for own activities"
    ON activity_locations FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id AND user_id = auth.uid()
    ));

  CREATE POLICY "Users can view locations for own activities"
    ON activity_locations FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id AND user_id = auth.uid()
    ));

  -- Activity Measurements
  CREATE POLICY "Users can create measurements for own activities"
    ON activity_measurements FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id AND user_id = auth.uid()
    ));

  CREATE POLICY "Users can view measurements for own activities"
    ON activity_measurements FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_id AND user_id = auth.uid()
    ));

  -- Sleep Records
  CREATE POLICY "Users can create own sleep records"
    ON sleep_records FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can read own sleep records"
    ON sleep_records FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own sleep records"
    ON sleep_records FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Growth Measurements
  CREATE POLICY "Users can create growth measurements"
    ON growth_measurements FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can read own growth measurements"
    ON growth_measurements FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own measurements"
    ON growth_measurements FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Conversations
  CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can read own conversations"
    ON conversations FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION calculate_activity_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.end_time IS NULL THEN
    NEW.end_time = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_pediatricians_updated_at
    BEFORE UPDATE ON pediatricians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER calculate_activity_duration_trigger
    BEFORE UPDATE ON activities
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND NEW.end_time IS NULL)
    EXECUTE FUNCTION calculate_activity_duration();

EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;