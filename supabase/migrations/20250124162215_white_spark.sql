/*
  # Initial Schema Setup for Order Submission System

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `created_at` (timestamp)
    
    - `submissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `address` (text)
      - `product_id` (uuid, references products)
      - `design_urls` (text array)
      - `mockup_url` (text)
      - `payment_screenshot_url` (text)
      - `status` (enum: pending/processed)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write their own submissions
    - Add policies for admins to read/write all submissions
    - Add policies for all users to read products
*/

-- Create custom types
CREATE TYPE submission_status AS ENUM ('pending', 'processed');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  design_urls text[] NOT NULL,
  mockup_url text NOT NULL,
  payment_screenshot_url text NOT NULL,
  status submission_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for submissions
CREATE POLICY "Users can create their own submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Only admins can update submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Insert some sample products
INSERT INTO products (name, description, price) VALUES
  ('Basic Package', 'Simple design package with up to 3 revisions', 99.99),
  ('Premium Package', 'Advanced design package with unlimited revisions', 199.99),
  ('Enterprise Package', 'Full service design package with priority support', 499.99);