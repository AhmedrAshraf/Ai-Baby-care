/*
  # Add Appointments and Pediatrician Information

  1. New Tables
    - `pediatricians`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `appointments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pediatrician_id` (uuid, references pediatricians)
      - `date` (timestamptz)
      - `type` (appointment_type enum)
      - `notes` (text)
      - `reminder_sent` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create appointment types enum
CREATE TYPE appointment_type AS ENUM (
  'checkup',
  'vaccination',
  'sick_visit',
  'follow_up',
  'other'
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

-- Create indexes
CREATE INDEX IF NOT EXISTS pediatricians_user_id_idx ON pediatricians(user_id);
CREATE INDEX IF NOT EXISTS appointments_user_id_date_idx ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS appointments_pediatrician_id_idx ON appointments(pediatrician_id);

-- Enable RLS
ALTER TABLE pediatricians ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for pediatricians
CREATE POLICY "Users can create own pediatricians"
  ON pediatricians
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own pediatricians"
  ON pediatricians
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pediatricians"
  ON pediatricians
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for appointments
CREATE POLICY "Users can create own appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_pediatricians_updated_at
  BEFORE UPDATE ON pediatricians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();