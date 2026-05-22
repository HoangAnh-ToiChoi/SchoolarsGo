import { useEffect, useState } from 'react';

export const useCounter = (end, duration = 1600, start = 0) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!end) return;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return count;
};
