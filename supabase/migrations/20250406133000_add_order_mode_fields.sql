-- Add order_mode and cod_amount columns to orders table
ALTER TABLE orders
ADD COLUMN order_mode VARCHAR NOT NULL DEFAULT 'Prepaid',
ADD COLUMN cod_amount VARCHAR;

-- Add check constraint to ensure order_mode is either 'Prepaid' or 'COD'
ALTER TABLE orders
ADD CONSTRAINT valid_order_mode CHECK (order_mode IN ('Prepaid', 'COD'));

-- Add trigger to ensure cod_amount is only set when order_mode is 'COD'
CREATE OR REPLACE FUNCTION check_cod_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_mode = 'COD' AND NEW.cod_amount IS NULL THEN
    RAISE EXCEPTION 'cod_amount must be set when order_mode is COD';
  END IF;
  IF NEW.order_mode = 'Prepaid' AND NEW.cod_amount IS NOT NULL THEN
    NEW.cod_amount = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cod_amount
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION check_cod_amount();

-- Add comment to explain the columns
COMMENT ON COLUMN orders.order_mode IS 'Payment mode for the order: Prepaid or COD';
COMMENT ON COLUMN orders.cod_amount IS 'Amount to be collected for COD orders'; 