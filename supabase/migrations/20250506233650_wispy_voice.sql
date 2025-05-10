/*
  # Add Test User with Correct Credentials

  1. Changes
    - Create test user with proper credentials
    - Set up metadata and role
    - Ensure email confirmation
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
  '{
    "parent_name": "Sarah Johnson",
    "baby_name": "Emma",
    "baby_birthday": "2023-09-15",
    "baby_gender": "girl",
    "relationship_to_child": "mother"
  }'
) ON CONFLICT (id) DO NOTHING;