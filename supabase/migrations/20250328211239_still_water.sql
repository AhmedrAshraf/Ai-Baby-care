/*
  # Add default user

  1. Changes
    - Insert default user (Sarah) into users table
    
  2. Notes
    - User will be created with a known ID for reference
    - Email matches the one shown in the UI
*/

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'sarah.j@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding record in public.users table
INSERT INTO public.users (
  id,
  email,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'sarah.j@example.com',
  now()
) ON CONFLICT (id) DO NOTHING;