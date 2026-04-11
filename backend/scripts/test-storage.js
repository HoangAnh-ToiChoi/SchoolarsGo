/**
 * Test script — Kiểm tra Supabase Storage connection
 *
 * Chạy: node scripts/test-storage.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Supabase Storage Test ===');
console.log('URL:', supabaseUrl);
console.log('Key prefix:', supabaseServiceKey ? supabaseServiceKey.slice(0, 10) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function testStorage() {
  // 1. Test: Kiểm tra bucket "documents" có tồn tại không
  console.log('\n--- Test 1: Kiểm tra bucket "documents" ---');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Lỗi khi liệt kê buckets:', listError.message);
    console.error('Chi tiết:', listError);
    return;
  }

  console.log('Danh sách buckets:', buckets.map(b => b.name));

  const documentsBucket = buckets.find(b => b.name === 'documents');
  if (!documentsBucket) {
    console.error('❌ Bucket "documents" KHÔNG TỒN TẠI!');
    console.log('→ Cần tạo bucket "documents" trên Supabase Dashboard');
    return;
  }

  console.log('✅ Bucket "documents" tồn tại');
  console.log('  Public:', documentsBucket.public);

  // 2. Test: Upload file test nhỏ
  console.log('\n--- Test 2: Upload file test ---');
  const testBuffer = Buffer.from('Test file content', 'utf-8');
  const testPath = `test/${Date.now()}_test.txt`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(testPath, testBuffer, {
      contentType: 'text/plain',
      upsert: false,
    });

  if (uploadError) {
    console.error('❌ Upload thất bại:', uploadError.message);
    console.error('Mã lỗi:', uploadError.statusCode);
    console.error('Chi tiết:', JSON.stringify(uploadError, null, 2));
    return;
  }

  console.log('✅ Upload thành công!');
  console.log('  Path:', uploadData.path);

  // 3. Cleanup
  console.log('\n--- Cleanup ---');
  await supabase.storage.from('documents').remove([testPath]);
  console.log('✅ Đã xóa file test');
}

testStorage().catch(console.error);
