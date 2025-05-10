/*
  # Add Baby Photo URL to User Profiles

  1. Changes
    - Add baby_photo_url column to user_profiles table
    - Create storage bucket for profile photos
    - Add policies for storage access

  2. Security
    - Enable RLS for storage bucket
    - Add policies for authenticated users
*/

-- Add baby_photo_url column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS baby_photo_url text;

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('profiles', 'profiles')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'baby-photos' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'baby-photos' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
)
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'baby-photos' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'baby-photos' AND
  auth.uid()::text = SPLIT_PART(SPLIT_PART(name, '/', 2), '-', 1)
);