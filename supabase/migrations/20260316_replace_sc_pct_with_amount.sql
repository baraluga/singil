-- Replace service_charge_pct (percentage) with service_charge_amount (flat peso amount).
-- SC is now split equally among members; no percentage back-calculation needed.
ALTER TABLE bills RENAME COLUMN service_charge_pct TO service_charge_amount;
ALTER TABLE bills ALTER COLUMN service_charge_amount TYPE DECIMAL(10, 2);
