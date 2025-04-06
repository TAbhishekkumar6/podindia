/*
  # Fix order status constraint

  1. Changes
    - Drop existing status constraint
    - Add new constraint with all valid statuses
    - Include payment verification statuses

  2. Implementation Details
    - Uses DO block for better error handling
    - Ensures all possible order statuses are included
    - Makes constraint changes idempotent
*/

DO $$ 
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_status;

    -- Add the new constraint with all possible statuses
    ALTER TABLE orders ADD CONSTRAINT valid_status CHECK (
        status = ANY(ARRAY[
            'pending',
            'processing',
            'printing',
            'packed',
            'dispatched',
            'error_occurred',
            'delay_in_printing',
            'half_payment_verification',
            'payment_verification'
        ])
    );

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RAISE;
END $$;