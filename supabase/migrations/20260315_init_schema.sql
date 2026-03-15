-- Singil Database Schema
-- Walking skeleton version - essential tables only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment Methods Table
-- Stores QR codes and payment info that the creator manages
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qr_url TEXT, -- Public URL to QR code image in storage
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bills Table
-- The main bill/occasion that's being split
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Ramen Nagi, BGC"
  date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  service_charge_pct DECIMAL(5, 2) NOT NULL DEFAULT 0, -- e.g., 10 for 10%
  receipt_url TEXT, -- Public URL to receipt image in storage
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members Table
-- Individual people in a bill and their payment status
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  share_amount DECIMAL(10, 2) NOT NULL, -- Includes SC
  is_paid BOOLEAN NOT NULL DEFAULT false,
  claimed_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_sort_order ON payment_methods(sort_order) WHERE is_active = true;
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_created_at ON bills(created_at DESC);
CREATE INDEX idx_members_bill_id ON members(bill_id);

-- RLS Policies

-- Payment Methods: Public can read active ones, only owner can modify
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment methods are viewable by everyone"
  ON payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Bills: Public can read, only owner can modify
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bills are viewable by everyone"
  ON bills FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);

-- Members: Public can read, only bill owner can modify
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members are viewable by everyone"
  ON members FOR SELECT
  USING (true);

CREATE POLICY "Bill owners can insert members"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = members.bill_id
      AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Bill owners can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = members.bill_id
      AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Bill owners can delete members"
  ON members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.id = members.bill_id
      AND bills.user_id = auth.uid()
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
