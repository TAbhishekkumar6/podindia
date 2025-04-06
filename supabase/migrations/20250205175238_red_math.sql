-- Add neck label and sleeves columns to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS neck_label text,
ADD COLUMN IF NOT EXISTS sleeves text;

-- Update existing rows to have 'No' as default
UPDATE order_items
SET neck_label = 'No',
    sleeves = 'No'
WHERE neck_label IS NULL
   OR sleeves IS NULL;

-- Make the columns required for future entries
ALTER TABLE order_items
ALTER COLUMN neck_label SET NOT NULL,
ALTER COLUMN sleeves SET NOT NULL;