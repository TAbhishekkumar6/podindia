/*
  # Add Error Logs Table

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `error_message` (text)
      - `error_stack` (text)
      - `user_agent` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for admins to read error logs
    - Add policy for public to create error logs
*/

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  error_message text NOT NULL,
  error_stack text,
  user_agent text,
  form_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create error logs"
  ON error_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can view error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');