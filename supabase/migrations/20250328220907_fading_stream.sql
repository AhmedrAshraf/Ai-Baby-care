/*
  # Create Test User

  1. Changes
    - Create test user in auth.users table with proper metadata
    - Handle existing user case with DO/DECLARE block
    - Set up proper authentication and confirmation

  2. Security
    - Password is properly hashed
    - User is pre-confirmed via email_confirmed_at
    - Proper role assignment
*/

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- First check if the user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sarah.j0@example.com') THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert the new user
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
      -- Using a pre-hashed password since we can't use gen_salt in migrations
      '$2a$10$RgZM5fXAx2b.VbMoU90qU.kOZw9sMxzETzH7Bx5mJ4FN9QhO/v5iO', -- This is 'password' hashed
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