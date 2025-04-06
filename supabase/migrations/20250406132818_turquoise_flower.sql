/*
  # Add shipment mode and COD amount

  1. Changes
    - Add shipment_mode column to orders table
    - Add cod_amount column to orders table
    - Update existing rows with default values

  2. Implementation Details
    - shipment_mode can be either 'COD' or 'Prepaid'
    - cod_amount is nullable and only used when shipment_mode is 'COD'
*/

DO $$ 
BEGIN
  -- Add shipment_mode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'shipment_mode'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipment_mode text NOT NULL DEFAULT 'Prepaid';
    -- Add check constraint for valid shipment modes
    ALTER TABLE orders ADD CONSTRAINT valid_shipment_mode 
      CHECK (shipment_mode IN ('COD', 'Prepaid'));
  END IF;

  -- Add cod_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'cod_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN cod_amount numeric(10,2);
  END IF;

  -- Add constraint to ensure cod_amount is set when shipment_mode is COD
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_cod_amount'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT valid_cod_amount 
      CHECK (
        (shipment_mode = 'COD' AND cod_amount IS NOT NULL) OR 
        (shipment_mode = 'Prepaid' AND cod_amount IS NULL)
      );
  END IF;
END $$;