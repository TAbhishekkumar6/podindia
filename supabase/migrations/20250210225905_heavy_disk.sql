/*
  # Add print size columns to order_items table

  1. Changes
    - Add front_print_size and back_print_size columns to order_items table
    - Set default values for existing rows
    - Make columns required for future entries

  2. Implementation Details
    - Uses DO block for better error handling
    - Handles column addition and updates in separate steps
    - Ensures idempotent operations with IF EXISTS checks
*/

DO $$ 
BEGIN
    -- First, check if the columns don't exist and add them
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'front_print_size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN front_print_size text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'back_print_size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN back_print_size text;
    END IF;

    -- Update existing rows with default value if they're null
    UPDATE order_items
    SET 
        front_print_size = COALESCE(front_print_size, 'No Print'),
        back_print_size = COALESCE(back_print_size, 'No Print');

    -- Make the columns required
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'front_print_size'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE order_items ALTER COLUMN front_print_size SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'back_print_size'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE order_items ALTER COLUMN back_print_size SET NOT NULL;
    END IF;

EXCEPTION
    WHEN others THEN
        -- Log the error (optional)
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        -- Re-raise the error
        RAISE;
END $$;