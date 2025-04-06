/*
  # Add payment screenshots support

  1. Changes
    - Add payment_screenshot_urls column to orders table
    - Update existing rows to use current payment_screenshot_url

  2. Notes
    - Maintains backward compatibility with existing payment_screenshot_url field
    - New column allows storing multiple payment screenshots
*/

-- Add payment_screenshot_urls column if it doesn't exist
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_screenshot_urls'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_screenshot_urls text[];
    END IF;

    -- Migrate existing data
    UPDATE orders 
    SET payment_screenshot_urls = ARRAY[payment_screenshot_url]
    WHERE payment_screenshot_urls IS NULL 
    AND payment_screenshot_url IS NOT NULL;

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RAISE;
END $$;