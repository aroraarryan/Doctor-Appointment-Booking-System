-- Migration to add fees column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0;

-- Update existing appointments with current doctor fees (approximate historical data)
UPDATE appointments a
SET fees = d.fees
FROM doctors d
WHERE a.doctor_id = d.id AND a.fees = 0;
