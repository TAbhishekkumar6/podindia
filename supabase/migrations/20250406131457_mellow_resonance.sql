/*
  # Add timestamp columns for order status tracking

  1. Changes
    - Add timestamp columns to track when each status was set:
      - pending_at
      - processing_at
      - printing_at
      - packed_at
      - error_occurred_at
      - delay_in_printing_at
      - dispatched_at
      - half_payment_verification_at
      - payment_verification_at
*/

DO $$ 
BEGIN
  -- Add timestamp columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pending_at') THEN
    ALTER TABLE orders ADD COLUMN pending_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'processing_at') THEN
    ALTER TABLE orders ADD COLUMN processing_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'printing_at') THEN
    ALTER TABLE orders ADD COLUMN printing_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'packed_at') THEN
    ALTER TABLE orders ADD COLUMN packed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'error_occurred_at') THEN
    ALTER TABLE orders ADD COLUMN error_occurred_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delay_in_printing_at') THEN
    ALTER TABLE orders ADD COLUMN delay_in_printing_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dispatched_at') THEN
    ALTER TABLE orders ADD COLUMN dispatched_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'half_payment_verification_at') THEN
    ALTER TABLE orders ADD COLUMN half_payment_verification_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_verification_at') THEN
    ALTER TABLE orders ADD COLUMN payment_verification_at timestamptz;
  END IF;

  -- Set initial values based on status and created_at
  UPDATE orders 
  SET pending_at = created_at 
  WHERE status = 'pending' AND pending_at IS NULL;

  UPDATE orders 
  SET processing_at = created_at 
  WHERE status = 'processing' AND processing_at IS NULL;

  UPDATE orders 
  SET printing_at = created_at 
  WHERE status = 'printing' AND printing_at IS NULL;

  UPDATE orders 
  SET packed_at = created_at 
  WHERE status = 'packed' AND packed_at IS NULL;

  UPDATE orders 
  SET error_occurred_at = created_at 
  WHERE status = 'error_occurred' AND error_occurred_at IS NULL;

  UPDATE orders 
  SET delay_in_printing_at = created_at 
  WHERE status = 'delay_in_printing' AND delay_in_printing_at IS NULL;

  UPDATE orders 
  SET dispatched_at = created_at 
  WHERE status = 'dispatched' AND dispatched_at IS NULL;

  UPDATE orders 
  SET half_payment_verification_at = created_at 
  WHERE status = 'half_payment_verification' AND half_payment_verification_at IS NULL;

  UPDATE orders 
  SET payment_verification_at = created_at 
  WHERE status = 'payment_verification' AND payment_verification_at IS NULL;
END $$;