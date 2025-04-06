/*
  # Add support for multiple products per order

  1. Changes
    - Modify orders table to support multiple products
    - Add new products table for order items
    - Add RLS policies

  2. New Tables
    - order_items
      - id (uuid, primary key)
      - order_id (uuid, references orders)
      - product (text)
      - size (text)
      - color (text)
      - quantity (integer)
*/

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product text NOT NULL,
    size text NOT NULL,
    color text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for order_items
CREATE POLICY "Public access to order_items"
    ON order_items
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Remove old product columns from orders table
DO $$ 
BEGIN
    ALTER TABLE orders
        DROP COLUMN IF EXISTS product,
        DROP COLUMN IF EXISTS size,
        DROP COLUMN IF EXISTS color;
EXCEPTION
    WHEN others THEN
        NULL;
END $$;