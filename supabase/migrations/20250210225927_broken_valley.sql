/*
  # Add payment info column to orders table

  1. Changes
    - Add payment_info column to orders table
    - Set default value for existing rows
    - Make column required for future entries

  2. Implementation Details
    - Uses DO block for better error handling
    - Handles column addition and updates in separate steps
    - Ensures idempotent operations with IF EXISTS checks
*/

DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_info'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_info text;
    END IF;

    -- Update existing rows with default value if they're null
    UPDATE orders
    SET payment_info = COALESCE(payment_info, 'Paid Full');

    -- Make the column required if it's not already
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_info'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE orders ALTER COLUMN payment_info SET NOT NULL;
    END IF;

EXCEPTION
    WHEN others THEN
        -- Log the error
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        -- Re-raise the error
        RAISE;
END $$;