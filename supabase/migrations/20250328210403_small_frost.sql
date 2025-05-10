/*
  # Create conversations table

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `content` (text)
      - `metadata` (jsonb)
      - `interaction_type` (text)
      - `created_at` (timestamp)
  2. Indexes
    - On interaction_type
    - On user_id and created_at DESC
  3. Security
    - Enable RLS
    - Add policies for creating and reading conversations
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  interaction_type text NOT NULL CHECK (interaction_type IN ('message', 'command', 'response', 'error')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_interaction_type_idx ON conversations(interaction_type);
CREATE INDEX IF NOT EXISTS conversations_user_id_created_at_idx ON conversations(user_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can create conversations"
    ON conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own conversations"
    ON conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;