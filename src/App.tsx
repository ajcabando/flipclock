import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from './context/SettingsContext';
import { Clock } from './components/Clock';
import { GearIcon } from './components/icons';
import { useNow } from './hooks/useNow';
import { useAutoHide } from './hooks/useAutoHide';
import { useSystemPrefs } from './hooks/useSystemPrefs';
import { useFullscreen } from './hooks/useFullscreen';
import { chime } from './lib/chime';
import { bridge, isDesktop, loadBounds, trackWindowBounds } from './lib/desktop';
import { GRADIENTS, clamp } from './lib/settings';
import { getTimeParts, hour24 } from './lib/time';

const SettingsPanel = lazy(() => import('./components/SettingsPanel'));

/**
 * Computes the auto-scale factor (0.4–2.6) so the main clock AND the
 * world-clock grid always fit the window when auto-scale is on, and publishes
 * the CSS variable the world-clock grid depends on:
 *
 * - `--wc-time-cap` (px): the largest world-clock flip-card height that fits
 *   its grid track (4 cards + colon + padding), so the CSS min() cap never
 *   overflows the card. Published at base scale; the CSS multiplies it by
 *   `--fit`.
 * - `--fit` (set in the theme effect): auto-scale factor (1 when off) that
 *   scales every world-clock dimension together with the main clock, so the
 *   whole dashboard keeps fitting the window.
 *
 * Mirrors the CSS sizing formulas in index.css. Columns converge after a few
 * fixed-point iterations (fit ↔ effective scale ↔ columns ↔ grid height).
 */
function useClockLayout(opts: {
  enabled: boolean;
  nCards: number;
  extraClocks: number;
  wcScale: number;
  wcTimeSize: number;
  wcSecondsSize: number;
  wcLabelSize: number;
  wcCitySize: number;
  showSeconds: boolean;
}): number {
  const {
    enabled,
    nCards,
    extraClocks,
    wcScale,
    wcTimeSize,
    wcSecondsSize,
    wcLabelSize,
    wcCitySize,
    showSeconds,
  } = opts;
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Main clock at base scale (mirrors useAutoFit's old formulas).
      const cardH = Math.max(56, Math.min(0.21 * vw, 520));
      const cardW = cardH * 0.74;
      const gap = Math.max(10, Math.min(0.014 * vw, 26));
      const colonW = cardW * 0.24;
      const metaH = Math.max(18, Math.min(0.022 * vw, 30)) + 26;
      const naturalW = nCards * cardW + colonW + gap * (nCards + 1);
      const gridW = Math.min(0.92 * vw, 820);

      // Fixed-point iteration: the effective world-clock scale includes the
      // fit factor, which depends on the grid height, which depends on the
      // columns, which depend on the effective scale. Converges in ≤ 3 passes.
      // When auto-scale is off the fit is always 1, so eff stays at the raw
      // wcScale — matching CSS, which renders at --fit: 1.
      let f = 1;
      let cardHMax = 18;
      let worldH = 0;
      for (let i = 0; i < 4; i++) {
        const eff = wcScale * (enabled ? f : 1);
        const colMin = Math.max(168 * eff, gridW / 2 - 10);
        const cols =
          extraClocks <= 1 || vw <= 440
            ? 1
            : Math.min(2, Math.max(1, Math.floor((gridW + 20) / (colMin + 20))));
        const track = (gridW - (cols - 1) * 20) / cols;
        // Width budget for colon + gaps in the flip-card row (seconds live in
        // the meta row, so they're not part of this row's width).
        const extras = 24 * wcScale;
        cardHMax = Math.max(18, (track - 40 * wcScale - extras) / 2.96);
        const wcCardH = Math.min((wcTimeSize / 0.68) * wcScale, cardHMax);
        const pad = 20 * wcScale;
        const wcMetaH = (Math.max(wcLabelSize, wcCitySize, showSeconds ? wcSecondsSize : 0) + 6) * wcScale;
        const rows = Math.ceil(extraClocks / cols);
        worldH =
          rows > 0 ? rows * (wcCardH + 2 * pad + 10 * wcScale + wcMetaH) + (rows - 1) * 20 + 28 : 0;
        const naturalH = cardH + metaH + worldH;
        f = clamp(Math.min((vw * 0.92) / naturalW, (vh * 0.82) / naturalH, 2.6), 0.4, 2.6);
      }
      document.documentElement.style.setProperty('--wc-time-cap', `${cardHMax}px`);
      setFit(enabled ? f : 1);
    };
    // useLayoutEffect: publish the real --wc-time-cap before the first paint
    // so the clock never flashes with the oversized :root default (1000px).
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [
    enabled,
    nCards,
    extraClocks,
    wcScale,
    wcTimeSize,
    wcSecondsSize,
    wcLabelSize,
    wcCitySize,
    showSeconds,
  ]);

  return fit;
}

export default function App() {
  const { settings, update } = useSettings();
  const system = useSystemPrefs();
  const fullscreen = useFullscreen();
  const now = useNow(1000);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(
    () => !localStorage.getItem('flipclock:hint-seen'),
  );
  const toastTimer = useRef(0);

  const uiHidden = useAutoHide(settings.autoHideUI && !panelOpen, 3000);

  const theme = settings.autoTheme ? (system.prefersDark ? 'dark' : 'light') : settings.theme;
  const animate =
    settings.animations === 'on' ||
    (settings.animations === 'reduced' && !system.prefersReducedMotion);

  const parts = useMemo(
    () => getTimeParts(now, settings.timezone, settings.hour12, settings.leadingZero),
    [now, settings.timezone, settings.hour12, settings.leadingZero],
  );
  const nCards = parts.hours.length + parts.minutes.length;
  const autoFit = useClockLayout({
    enabled: settings.autoScale,
    nCards,
    extraClocks: settings.extraClocks.length,
    wcScale: settings.wcScale,
    wcTimeSize: settings.wcTimeSize,
    wcSecondsSize: settings.wcSecondsSize,
    wcLabelSize: settings.wcLabelSize,
    wcCitySize: settings.wcCitySize,
    showSeconds: settings.showSeconds,
  });
  const scale = settings.autoScale ? autoFit : clamp(settings.scale, 0.5, 2.5);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Apply theme + settings to the DOM ────────────────────────────────────
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.desktop = isDesktop ? 'true' : '';
    el.dataset.theme = theme;
    el.dataset.accent = settings.accent;
    el.dataset.font = settings.font;
    el.dataset.face = settings.face;
    el.dataset.contrast = settings.highContrast ? 'high' : '';
    el.dataset.shadows = settings.showShadows ? 'on' : 'off';
    el.dataset.bg = settings.background.type;
    el.style.setProperty('--scale', String(scale));
    // --fit scales the world-clock grid together with the main clock in
    // auto-scale mode (1 when off, so the sliders stay absolute).
    el.style.setProperty('--fit', String(settings.autoScale ? autoFit : 1));
    // World-clock sizing — independent of the main clock.
    el.style.setProperty('--wc-scale', String(clamp(settings.wcScale, 0.6, 2)));
    el.style.setProperty('--wc-time-size', `${clamp(settings.wcTimeSize, 28, 80)}px`);
    el.style.setProperty('--wc-seconds-size', `${clamp(settings.wcSecondsSize, 16, 30)}px`);
    el.style.setProperty('--wc-label-size', `${clamp(settings.wcLabelSize, 12, 24)}px`);
    el.style.setProperty('--wc-city-size', `${clamp(settings.wcCitySize, 10, 20)}px`);
    el.style.setProperty('--flip-duration', `${settings.animSpeed}ms`);
    el.style.setProperty('--corner-mult', String(clamp(settings.cornerRadius, 0, 100) / 100));
    el.style.setProperty('--window-opacity', String(clamp(settings.transparency, 40, 100) / 100));
    // Font color override (digits + colon). 'auto' → let the theme decide.
    if (settings.fontColor && settings.fontColor !== 'auto' && /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(settings.fontColor)) {
      el.style.setProperty('--digit', settings.fontColor);
    } else {
      el.style.removeProperty('--digit');
    }
    // Digit size override. 0 = auto (per-font defaults in the stylesheet).
    if (settings.digitRatio > 0) {
      el.style.setProperty('--digit-ratio', String(clamp(settings.digitRatio, 0.4, 1)));
    } else {
      el.style.removeProperty('--digit-ratio');
    }
    const grad = GRADIENTS.find((g) => g.id === settings.background.gradient) ?? GRADIENTS[0];
    if (settings.background.type === 'gradient') {
      el.style.setProperty('--bg-gradient', grad.css);
    }
    if (settings.background.type === 'image') {
      el.style.setProperty('--bg-image', settings.background.image ? `url("${settings.background.image}")` : 'none');
    }
  }, [theme, settings, scale]);

  // ── Document title ───────────────────────────────────────────────────────
  useEffect(() => {
    document.title = `${parts.hours.join('')}:${parts.minutes.join('')}${parts.ampm ? ` ${parts.ampm}` : ''} — Flip Clock`;
  }, [parts]);

  // ── First-run hint ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hintVisible) return;
    const t = window.setTimeout(() => setHintVisible(false), 6000);
    localStorage.setItem('flipclock:hint-seen', '1');
    return () => window.clearTimeout(t);
  }, [hintVisible]);

  // ── Hourly chime ─────────────────────────────────────────────────────────
  const prevChimeKey = useRef('');
  useEffect(() => {
    if (!settings.chime) return;
    const key = `${parts.minutes.join('')}:${parts.seconds}`;
    if (parts.minutes.join('') === '00' && parts.seconds === '00' && prevChimeKey.current !== key) {
      const h = hour24(now, settings.timezone);
      chime.play(((h % 12) || 12));
    }
    prevChimeKey.current = key;
  }, [now, settings.chime, settings.timezone, parts]);

  // ── Desktop bridge sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDesktop) return;
    const b = bridge();
    b.setAlwaysOnTop(settings.alwaysOnTop);
    b.setClickThrough(settings.clickThrough);
    b.setWindowOpacity(clamp(settings.transparency, 40, 100) / 100);
    b.setLaunchAtStartup(settings.launchAtStartup);
    // Persist window bounds so position/size can be restored next launch.
    trackWindowBounds();
  }, [settings.alwaysOnTop, settings.clickThrough, settings.transparency, settings.launchAtStartup]);

  // Restore window bounds on launch (desktop build).
  useEffect(() => {
    if (!isDesktop) return;
    const bounds = loadBounds();
    if (bounds && settings.rememberPosition) {
      bridge().setWindowPosition(bounds.x, bounds.y);
    }
    if (bounds && settings.rememberSize) {
      bridge().setWindowSize(bounds.w, bounds.h);
    }
  }, [settings.rememberPosition, settings.rememberSize]);

  // ── Unlock audio on first gesture (needed for the chime) ─────────────────
  useEffect(() => {
    const unlock = () => chime.ensure();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
        return;
      }
      const k = e.key.toLowerCase();
      switch (k) {
        case 'f':
          fullscreen.toggle();
          break;
        case 't':
          update({ theme: theme === 'dark' ? 'light' : 'dark', autoTheme: false });
          break;
        case 's':
          update({ showSeconds: !settings.showSeconds });
          break;
        case 'd':
          update({ showDate: !settings.showDate });
          break;
        case 'm':
          update({ hour12: !settings.hour12 });
          break;
        case 'h':
          update({ autoHideUI: !settings.autoHideUI });
          break;
        case 'a':
          if (isDesktop) update({ alwaysOnTop: !settings.alwaysOnTop });
          else showToast('Always on top is available in the desktop build');
          break;
        case '+':
        case '=':
          update({ scale: clamp(settings.scale + 0.1, 0.5, 2.5) });
          break;
        case '-':
        case '_':
          update({ scale: clamp(settings.scale - 0.1, 0.5, 2.5) });
          break;
        case 'r':
          update({ scale: 1 });
          if (isDesktop) bridge().setWindowPosition(0, 0);
          break;
        case 'escape':
          if (panelOpen) {
            setPanelOpen(false);
            window.setTimeout(() => setPanelMounted(false), 240);
          } else if (document.fullscreenElement) {
            void document.exitFullscreen().catch(() => {});
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, theme, update, settings.showSeconds, settings.showDate, settings.hour12, settings.autoHideUI, settings.alwaysOnTop, settings.scale, panelOpen, showToast]);

  // ── Panel open / close with exit transition ──────────────────────────────
  const openPanel = useCallback(() => {
    setPanelMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPanelOpen(true)));
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    window.setTimeout(() => setPanelMounted(false), 240);
  }, []);

  return (
    // The whole window is a drag region (Tauri build) — grab anywhere to move
    // it. It's removed while the settings panel is open so the modal backdrop
    // click-to-close and its controls work normally. Note: dragging swallows
    // dblclick in Tauri, so the hover-revealed gear is the reliable way to
    // open Settings; dblclick still works in the browser build.
    <div
      className={`app ${uiHidden ? 'ui-hidden' : ''}`}
      data-tauri-drag-region={panelOpen ? undefined : ''}
    >
      {/* Clock — double-click opens settings (browser build) */}
      <main className="clock-wrap" onDoubleClick={panelOpen ? closePanel : openPanel}>
        <Clock
          now={now}
          animate={animate}
          extraClocks={settings.extraClocks}
        />
      </main>

      {/* Settings gear — fades in on hover (buttons stay clickable inside the
          drag region, and this is the reliable Settings access in Tauri) */}
      <button
        type="button"
        className="gear-fab"
        aria-label="Settings"
        title="Settings"
        onClick={panelOpen ? closePanel : openPanel}
        hidden={panelOpen}
      >
        <GearIcon />
      </button>

      {/* First-run hint */}
      {hintVisible && (
        <div className="hint" role="status">
          Move the mouse to the top-right corner for settings · <kbd className="kbd">F</kbd> fullscreen ·{' '}
          <kbd className="kbd">+</kbd>/<kbd className="kbd">−</kbd> size
        </div>
      )}

      {/* Settings panel (lazy-loaded) */}
      {panelMounted && (
        <Suspense fallback={null}>
          <SettingsPanel open={panelOpen} onClose={closePanel} onToast={showToast} onFullscreen={fullscreen.toggle} />
        </Suspense>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
