/*
  # Fix Authentication Setup

  1. Create Test User
    - Creates a test user with email 'sarah.j0@example.com'
    - Sets up proper authentication and permissions
    - Uses secure password hashing
  
  2. Permissions
    - Grants necessary database permissions to authenticated users
*/

-- Create the test user if it doesn't exist
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- First check if the user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sarah.j0@example.com') THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert the new user into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      confirmation_token,
      recovery_token,
      instance_id
    ) VALUES (
      new_user_id,
      'sarah.j0@example.com',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(),
      'authenticated',
      encode(gen_random_bytes(32), 'base64'),
      encode(gen_random_bytes(32), 'base64'),
      '00000000-0000-0000-0000-000000000000'
    );
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;