/*
  # Update Storage Bucket Policies

  1. Changes
    - Allow public uploads to storage buckets
    - Remove authentication requirement for uploads
    - Maintain public access for viewing files

  2. Security
    - Files can be uploaded by anyone
    - Files can be viewed by anyone
    - File types and sizes are still validated at the application level
*/

-- Drop existing upload policy
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;

-- Create new public upload policy
CREATE POLICY "Public Upload"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id IN ('designs', 'mockups', 'payments'));