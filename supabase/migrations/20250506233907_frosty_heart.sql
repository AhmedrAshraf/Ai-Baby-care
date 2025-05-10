/*
  # Update Test User with Profile Data

  1. Changes
    - Create test user with proper metadata
    - Set up user profile information
    - Ensure email is pre-confirmed
    
  2. Security
    - Use secure password hashing
    - Set proper role and permissions
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

-- Insert corresponding profile record
INSERT INTO user_profiles (
  user_id,
  parent_name,
  baby_name,
  baby_birthday,
  baby_gender,
  relationship_to_child
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Sarah Johnson',
  'Emma',
  '2023-09-15',
  'girl',
  'mother'
) ON CONFLICT (user_id) DO NOTHING;