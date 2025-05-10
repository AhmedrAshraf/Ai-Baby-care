/*
  # Auth Users Setup
  
  1. Changes
    - Create auth schema if it doesn't exist
    - Set up auth.users table with proper schema
    - Configure RLS policies for auth.users
    - Add necessary indexes
  
  2. Security
    - Enable RLS on auth.users
    - Add policies for user access
    - Set up proper role-based access
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY,
  aud character varying(255),
  role character varying(255),
  email character varying(255),
  encrypted_password character varying(255),
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token character varying(255),
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying(255),
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying(255),
  email_change character varying(255),
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  phone character varying(255) NULL,
  phone_confirmed_at timestamp with time zone,
  phone_change character varying(255) DEFAULT ''::character varying,
  phone_change_token character varying(255) DEFAULT ''::character varying,
  phone_change_sent_at timestamp with time zone,
  confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current character varying(255) DEFAULT ''::character varying,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamp with time zone,
  reauthentication_token character varying(255) DEFAULT ''::character varying,
  reauthentication_sent_at timestamp with time zone,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamp with time zone,
  CONSTRAINT users_email_change_confirm_status_check CHECK ((email_change_confirm_status >= 0))
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (id);

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
  CREATE POLICY "Users can read own data"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own data"
    ON auth.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create test user if it doesn't exist
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'sarah.j0@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;