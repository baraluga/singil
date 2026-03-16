CREATE TABLE bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  claimed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_bill_items_claimed_by ON bill_items(claimed_by);

ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON bill_items FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON bill_items FOR ALL USING (true);
