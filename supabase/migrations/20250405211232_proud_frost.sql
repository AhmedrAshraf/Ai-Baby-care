/*
  # Add Relationship to Child Field

  1. Changes
    - Add relationship_to_child column to user_profiles table
    - Add validation for relationship values
    - Update existing rows with default value

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add relationship_to_child column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS relationship_to_child text NOT NULL DEFAULT 'guardian';

-- Add check constraint for common relationships
ALTER TABLE user_profiles
ADD CONSTRAINT valid_relationship_types 
CHECK (
  relationship_to_child IN (
    'mother',
    'father',
    'guardian'
  ) OR 
  length(relationship_to_child) <= 50
);

-- Add comment explaining the column
COMMENT ON COLUMN user_profiles.relationship_to_child IS 
'Stores the relationship between the user and the child. Can be mother, father, guardian, or a custom value up to 50 characters.';