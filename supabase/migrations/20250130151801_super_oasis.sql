-- Add any missing columns to orders table if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_link text,
ADD COLUMN IF NOT EXISTS tracking_sent_at timestamptz;

-- Ensure the status check constraint exists
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_order_id_idx ON orders(order_id);