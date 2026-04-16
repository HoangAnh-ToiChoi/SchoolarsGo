/**
 * Debug script — In chi tiết response từ Supabase Storage upload
 *
 * Chạy: node scripts/debug-upload.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Debug Upload ===');
console.log('URL:', supabaseUrl);

// Tạo file test nhỏ
const testFilePath = require('path').resolve(__dirname, '../test-upload-debug.txt');
fs.writeFileSync(testFilePath, 'Debug test content ' + Date.now());

async function debugUpload() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testBuffer = fs.readFileSync(testFilePath);
  const storagePath = `debug/test_${Date.now()}.txt`;

  console.log('\n--- Upload với response chi tiết ---');
  console.log('Storage path:', storagePath);
  console.log('Buffer length:', testBuffer.length);

  const result = await supabase.storage
    .from('documents')
    .upload(storagePath, testBuffer, {
      contentType: 'text/plain',
      upsert: false,
    });

  console.log('\n=== RAW RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n=== ANALYSIS ===');
  console.log('result.error:', result.error);
  console.log('result.data:', result.data);
  console.log('typeof result.data:', typeof result.data);
  if (result.data) {
    console.log('result.data.path:', result.data.path);
  }

  // Cleanup
  await supabase.storage.from('documents').remove([storagePath]);
  fs.unlinkSync(testFilePath);
  console.log('\n✅ Đã cleanup');
}

debugUpload().catch(console.error);
