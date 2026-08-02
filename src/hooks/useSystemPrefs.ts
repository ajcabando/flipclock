import { useEffect, useState } from 'react';

export interface SystemPrefs {
  prefersDark: boolean;
  prefersReducedMotion: boolean;
}

export function useSystemPrefs(): SystemPrefs {
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    const mqRm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onDark = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    const onRm = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mqDark.addEventListener('change', onDark);
    mqRm.addEventListener('change', onRm);
    return () => {
      mqDark.removeEventListener('change', onDark);
      mqRm.removeEventListener('change', onRm);
    };
  }, []);

  return { prefersDark, prefersReducedMotion };
}
