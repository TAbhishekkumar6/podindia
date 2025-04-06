/*
  # Update order status options

  1. Changes
    - Add check constraint for order status with new status options
    - Add index on order_id and status columns for faster queries

  2. Security
    - Maintains existing RLS policies
*/

DO $$ BEGIN
  -- Create temp type to validate status
  CREATE TYPE valid_order_status AS ENUM (
    'pending',
    'processing',
    'printing',
    'packed',
    'error_occurred',
    'delay_in_printing',
    'dispatched'
  );
  
  -- Add check constraint
  ALTER TABLE orders ADD CONSTRAINT valid_status CHECK (
    status = ANY(ARRAY[
      'pending',
      'processing',
      'printing',
      'packed',
      'error_occurred',
      'delay_in_printing',
      'dispatched'
    ])
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
  CREATE INDEX IF NOT EXISTS orders_order_id_idx ON orders(order_id);
END $$;