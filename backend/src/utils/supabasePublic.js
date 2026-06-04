'use strict';
const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabasePublic() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY');
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

module.exports = getSupabasePublic;
