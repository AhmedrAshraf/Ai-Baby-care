/*
  # Create growth measurements table

  1. New Tables
    - `growth_measurements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `date` (timestamptz)
      - `weight` (numeric)
      - `weight_unit` (text)
      - `height` (numeric)
      - `height_unit` (text)
      - `head_circumference` (numeric)
      - `head_unit` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS growth_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
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

CREATE INDEX IF NOT EXISTS growth_measurements_user_id_date_idx ON growth_measurements(user_id, date DESC);

ALTER TABLE growth_measurements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can create growth measurements"
    ON growth_measurements
    FOR INSERT
    TO public
    WITH CHECK ((auth.uid() = user_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own growth measurements"
    ON growth_measurements
    FOR SELECT
    TO public
    USING ((auth.uid() = user_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own measurements"
    ON growth_measurements
    FOR UPDATE
    TO public
    USING ((auth.uid() = user_id))
    WITH CHECK ((auth.uid() = user_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;