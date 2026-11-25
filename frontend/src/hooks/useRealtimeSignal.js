import { useEffect, useRef } from 'react';
import { getRealtimeClient } from '~/utils/realtime';

/**
 * Nghe một tín hiệu Broadcast của Supabase Realtime (DB phát qua trigger, migration 010).
 * Tín hiệu chỉ báo "có thay đổi": nơi dùng tự gọi lại API. topic rỗng hoặc realtime tắt thì không làm gì.
 */
export function useRealtimeSignal(topic, event, onSignal) {
  const handlerRef = useRef(onSignal);

  useEffect(() => {
    handlerRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    const clientPromise = topic ? getRealtimeClient() : null;
    if (!clientPromise) return undefined;

    let client = null;
    let channel = null;
    let cancelled = false;
    clientPromise.then(function subscribe(realtime) {
      if (cancelled) return;
      client = realtime;
      channel = realtime
        .channel(topic)
        .on('broadcast', { event }, (message) => handlerRef.current(message.payload ?? {}))
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (client && channel) client.removeChannel(channel);
    };
  }, [topic, event]);
}
