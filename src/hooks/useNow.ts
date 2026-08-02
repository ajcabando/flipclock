import { useEffect, useState } from 'react';

/**
 * Returns `new Date()` refreshed on second (or custom interval) boundaries,
 * aligned to the clock so the value changes right at each tick.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;
    const schedule = () => {
      const delay = intervalMs - (Date.now() % intervalMs) + 10;
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [intervalMs]);

  return now;
}
