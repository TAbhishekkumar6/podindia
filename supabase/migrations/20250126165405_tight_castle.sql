/*
  # Create orders table and policies

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `order_id` (text, unique)
      - `name` (text)
      - `brand_name` (text)
      - `address` (text)
      - `phone` (text)
      - `whatsapp` (text)
      - `product` (text)
      - `size` (text)
      - `color` (text)
      - `design_urls` (text[])
      - `mockup_url` (text)
      - `payment_screenshot_url` (text)
      - `status` (text, default: 'pending')
      - `tracking_link` (text, nullable)
      - `tracking_sent_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on orders table
    - Drop existing policy if exists
    - Create new public access policy
*/

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  name text NOT NULL,
  brand_name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  product text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  design_urls text[] NOT NULL,
  mockup_url text NOT NULL,
  payment_screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tracking_link text,
  tracking_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public access" ON orders;

-- Create new public access policy
CREATE POLICY "Public access"
  ON orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);