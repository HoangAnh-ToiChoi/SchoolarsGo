'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
(async function() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { count } = await sb.from('scholarships').select('*', { count: 'exact', head: true });
  console.log(new Date().toISOString() + ' — Total scholarships: ' + count);
})().catch(function(e) { console.error(e.message); });
