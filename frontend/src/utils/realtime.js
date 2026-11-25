import { SUPABASE_ANON_KEY, SUPABASE_URL } from '~/utils/constants';

let clientPromise = null;

export function isRealtimeEnabled() {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !isDemo;
}

/**
 * Một kết nối Realtime dùng chung cho cả app, tải lười để thư viện không nằm trong chunk đầu.
 * Trả null khi realtime tắt.
 */
export function getRealtimeClient() {
  if (!isRealtimeEnabled()) return null;
  clientPromise ||= import('@supabase/realtime-js').then(function createClient({ RealtimeClient }) {
    return new RealtimeClient(`${SUPABASE_URL}/realtime/v1`, { params: { apikey: SUPABASE_ANON_KEY } });
  });
  return clientPromise;
}
