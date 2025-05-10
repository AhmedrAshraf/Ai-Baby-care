/*
  # Fix Quick Actions RLS Policies

  1. Changes
    - Drop existing RLS policies for quick_actions table
    - Create new comprehensive RLS policies for quick_actions table
      - Allow authenticated users to insert their own records
      - Allow authenticated users to update their own records
      - Allow authenticated users to read their own records

  2. Security
    - Enable RLS on quick_actions table
    - Add policies to ensure users can only access their own data
    - Verify user_id matches authenticated user's ID
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own quick actions" ON quick_actions;
DROP POLICY IF EXISTS "Users can read own quick actions" ON quick_actions;
DROP POLICY IF EXISTS "Users can update own quick actions" ON quick_actions;

-- Create new policies
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