'use strict';
const { createClient } = require('@supabase/supabase-js');

let client;

function getSupabase() {
  if (client) return client;
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

module.exports = getSupabase;
