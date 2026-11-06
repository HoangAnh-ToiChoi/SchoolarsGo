import { useEffect, useState } from 'react';

// Ngưỡng coi là tải chậm (ms)
export const SLOW_LOADING_MS = 5000;

// Trả về true khi isLoading kéo dài quá `delay` ms; có dữ liệu (isLoading = false) thì về false ngay
export function useSlowLoading(isLoading, delay = SLOW_LOADING_MS) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setIsSlow(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return isSlow;
}
