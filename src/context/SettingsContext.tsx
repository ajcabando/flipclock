import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULTS,
  loadSettings,
  readShared,
  saveSettings,
  sharedKey,
  type Settings,
} from '../lib/settings';

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Persist whenever settings change (unless the user disabled persistence).
  useEffect(() => {
    if (!settings.rememberSettings) return;
    saveSettings(settings);
  }, [settings]);

  // Migrate between per-instance and shared storage when the toggle changes.
  const prevShare = useRef(settings.shareAcrossWindows);
  useEffect(() => {
    if (prevShare.current === settings.shareAcrossWindows) return;
    prevShare.current = settings.shareAcrossWindows;
    if (settings.shareAcrossWindows) {
      const shared = readShared();
      if (shared) setSettings({ ...shared, shareAcrossWindows: true });
    }
    // Turning sharing OFF falls through to the persist effect, which writes
    // the current settings back to this window's private key.
  }, [settings.shareAcrossWindows]);

  // Live sync across windows while sharing is enabled.
  useEffect(() => {
    if (!settings.shareAcrossWindows) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === sharedKey() && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue) as Settings);
        } catch {
          /* ignore malformed */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [settings.shareAcrossWindows]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings({ ...DEFAULTS, rememberSettings: true, shareAcrossWindows: false });
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
