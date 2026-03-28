const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client dùng ANON key (public) — cho các truy vấn thông thường
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client dùng SERVICE ROLE key — chỉ dùng trong server-side, không expose cho FE
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase, supabaseAdmin };
