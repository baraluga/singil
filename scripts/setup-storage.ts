/**
 * Script to create Supabase storage buckets
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { supabaseAdmin } from '../lib/supabase-admin';

async function setupStorage() {
  console.log('🗄️  Setting up storage buckets...\n');

  try {
    // Create receipts bucket
    console.log('Creating "receipts" bucket...');
    const { data: receiptsData, error: receiptsError } = await supabaseAdmin.storage.createBucket('receipts', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (receiptsError && !receiptsError.message.includes('already exists')) {
      console.error('❌ Error creating receipts bucket:', receiptsError);
    } else {
      console.log('✅ Receipts bucket created (or already exists)');
    }

    // Create qr-codes bucket
    console.log('Creating "qr-codes" bucket...');
    const { data: qrData, error: qrError } = await supabaseAdmin.storage.createBucket('qr-codes', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (qrError && !qrError.message.includes('already exists')) {
      console.error('❌ Error creating qr-codes bucket:', qrError);
    } else {
      console.log('✅ QR codes bucket created (or already exists)');
    }

    console.log('\n✨ Storage setup complete!\n');
    console.log('You can verify at: https://supabase.com/dashboard/project/crmflgafhzdytacttxnq/storage\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupStorage();
