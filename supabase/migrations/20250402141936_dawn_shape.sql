/*
  # Add Unique Constraint to Quick Actions Table

  1. Changes
    - Add unique constraint on user_id and type columns
    - This enables the ON CONFLICT clause to work properly

  2. Security
    - No changes to existing RLS policies
*/

-- Add unique constraint for user_id and type combination
ALTER TABLE quick_actions
ADD CONSTRAINT quick_actions_user_id_type_key UNIQUE (user_id, type);