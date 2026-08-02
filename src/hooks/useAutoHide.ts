import { useEffect, useState } from 'react';

/**
 * Hides the chrome (settings button etc.) after the mouse is idle for
 * `delay` ms. Any mouse/wheel/pointer activity wakes the UI again.
 */
export function useAutoHide(enabled: boolean, delay = 3000): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }
    let timer: number;
    const wake = () => {
      setHidden(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHidden(true), delay);
    };
    wake();
    window.addEventListener('mousemove', wake, { passive: true });
    window.addEventListener('pointerdown', wake);
    window.addEventListener('wheel', wake, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('wheel', wake);
    };
  }, [enabled, delay]);

  return hidden;
}
