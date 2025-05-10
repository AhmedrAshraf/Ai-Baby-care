/*
  # Update Users Table Schema
  
  1. Changes
    - Drop public.users table since auth.users is the source of truth
    - Create foreign key references to auth.users instead
  
  2. Security
    - Maintain RLS policies on dependent tables
    - Update foreign key constraints
*/

-- First drop the foreign key constraints that reference the public.users table
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE sleep_sessions DROP CONSTRAINT IF EXISTS sleep_sessions_user_id_fkey;
ALTER TABLE growth_measurements DROP CONSTRAINT IF EXISTS growth_measurements_user_id_fkey;

-- Drop the public.users table
DROP TABLE IF EXISTS public.users;

-- Update foreign key constraints to reference auth.users
ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);

ALTER TABLE sleep_sessions
  ADD CONSTRAINT sleep_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);

ALTER TABLE growth_measurements
  ADD CONSTRAINT growth_measurements_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);