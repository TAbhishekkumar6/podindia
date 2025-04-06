/*
  # Fix PL/pgSQL syntax and status updates

  1. Changes
    - Fix PL/pgSQL block syntax for status updates
    - Ensure proper DO $$ BEGIN structure
    - Maintain all existing functionality
*/

DO $$ 
DECLARE
  status_exists boolean;
BEGIN
  -- Check if the status column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'status'
  ) INTO status_exists;

  -- Only proceed if the status column exists
  IF status_exists THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_status_date_trigger ON orders;

    -- Create or replace the function with proper syntax
    CREATE OR REPLACE FUNCTION update_status_date()
    RETURNS TRIGGER AS $func$
    BEGIN
      CASE NEW.status
        WHEN 'pending' THEN
          NEW.pending_at = COALESCE(NEW.pending_at, now());
        WHEN 'processing' THEN
          NEW.processing_at = now();
        WHEN 'printing' THEN
          NEW.printing_at = now();
        WHEN 'packed' THEN
          NEW.packed_at = now();
        WHEN 'error_occurred' THEN
          NEW.error_occurred_at = now();
        WHEN 'delay_in_printing' THEN
          NEW.delay_in_printing_at = now();
        WHEN 'dispatched' THEN
          NEW.dispatched_at = now();
        WHEN 'half_payment_verification' THEN
          NEW.half_payment_verification_at = now();
        WHEN 'payment_verification' THEN
          NEW.payment_verification_at = now();
      END CASE;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Create the trigger
    CREATE TRIGGER update_status_date_trigger
      BEFORE UPDATE OF status ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_status_date();
  END IF;
END $$;