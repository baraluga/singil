# Storage Buckets Setup

Run these commands in the Supabase SQL Editor to create the storage buckets:

## 1. Create Receipts Bucket

```sql
-- Create receipts bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Allow public read access
CREATE POLICY "Receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
```

## 2. Create QR Codes Bucket

```sql
-- Create qr-codes bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true);

-- Allow public read access
CREATE POLICY "QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Allow authenticated users to upload/update/delete their own QR codes
CREATE POLICY "Users can manage their own QR codes"
ON storage.objects FOR ALL
USING (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Alternative: Via Dashboard

1. Go to Storage in Supabase Dashboard
2. Click "New Bucket"
3. Create "receipts" bucket, make it public
4. Create "qr-codes" bucket, make it public
