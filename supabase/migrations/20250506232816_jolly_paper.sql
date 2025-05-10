/*
  # Create Default User

  1. Changes
    - Create default user in auth.users table
    - Set up proper authentication and confirmation
    
  2. Security
    - Password is properly hashed
    - User is pre-confirmed
    - Proper role assignment
*/

INSERT INTO auth.users (
  id,
  instance_id,
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
  '00000000-0000-0000-0000-000000000000',
  'sarah.j@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;