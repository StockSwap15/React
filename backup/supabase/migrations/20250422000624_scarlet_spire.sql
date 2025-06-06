-- First drop the existing constraints
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS status_check;

-- Add updated status check constraint that includes 'searching'
ALTER TABLE listings
ADD CONSTRAINT status_check 
CHECK (status IN ('available', 'pending', 'sold', 'cancelled', 'searching'));

-- Make VIN and PDI fee nullable
ALTER TABLE listings
ALTER COLUMN vin DROP NOT NULL,
ALTER COLUMN pdi_fee DROP NOT NULL;