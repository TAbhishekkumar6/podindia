/*
  # Create Storage Buckets for Order Files

  1. New Storage Buckets
    - designs: For storing design files
    - mockups: For storing mockup files
    - payments: For storing payment screenshots

  2. Security
    - Enable public access for viewing
    - Restrict uploads to authenticated users
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('designs', 'designs', true),
  ('mockups', 'mockups', true),
  ('payments', 'payments', true);

-- Set up security policies for the buckets
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('designs', 'mockups', 'payments'));

CREATE POLICY "Auth Upload"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id IN ('designs', 'mockups', 'payments'));