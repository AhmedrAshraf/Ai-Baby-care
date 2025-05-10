/*
  # Quick Actions Schema Update

  1. New Tables
    - quick_actions
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - type (text)
      - last_used (timestamptz)
      - metadata (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on quick_actions table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,
  last_used timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX quick_actions_user_id_type_idx ON quick_actions(user_id, type);
CREATE INDEX quick_actions_user_id_last_used_idx ON quick_actions(user_id, last_used DESC);

-- Create policies
CREATE POLICY "Users can create own quick actions"
  ON quick_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own quick actions"
  ON quick_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quick actions"
  ON quick_actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();