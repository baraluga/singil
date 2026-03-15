-- Collections: groups multiple bills into one shareable link
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: which bills belong to which collection
CREATE TABLE collection_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, bill_id)
);

-- Indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_bills_collection_id ON collection_bills(collection_id);
CREATE INDEX idx_collection_bills_bill_id ON collection_bills(bill_id);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are viewable by everyone"
  ON collections FOR SELECT USING (true);

CREATE POLICY "Users can insert their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE collection_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection bills are viewable by everyone"
  ON collection_bills FOR SELECT USING (true);

CREATE POLICY "Collection owners can insert collection bills"
  ON collection_bills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_bills.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Collection owners can delete collection bills"
  ON collection_bills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_bills.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
