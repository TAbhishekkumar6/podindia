-- Add mockup_urls column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mockup_urls text[];

-- Migrate existing data
UPDATE orders 
SET mockup_urls = ARRAY[mockup_url]
WHERE mockup_urls IS NULL AND mockup_url IS NOT NULL;