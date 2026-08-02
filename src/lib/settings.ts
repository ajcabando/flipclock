// ─── Settings model, presets and per-instance persistence ────────────────────
// Each browser window (instance) gets its own settings key, so unlimited
// independent clock windows work out of the box. "Share across windows"
// switches to a shared key and live-syncs via the `storage` event.

export type ThemeId = 'dark' | 'light' | 'oled' | 'blue' | 'green' | 'amber' | 'rose' | 'graphite' | 'violet' | 'teal' | 'copper' | 'navy';
export type AccentId = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'white';
export type FontId = 'inter' | 'sf' | 'roboto' | 'jetbrains' | 'din' | 'bebas';
export type FaceId = 'rounded' | 'sharp' | 'retro' | 'minimal' | 'glass' | 'neon';
export type AnimMode = 'on' | 'off' | 'reduced';
export type BgType = 'theme' | 'gradient' | 'image';

export interface Background {
  type: BgType;
  gradient: string; // gradient id
  image: string | null; // data URL
}

export interface Settings {
  // Appearance
  theme: ThemeId;
  autoTheme: boolean;
  accent: AccentId;
  font: FontId;
  face: FaceId;
  background: Background;
  fontColor: string; // 'auto' or a hex color for the digits
  digitRatio: number; // 0 = auto (per-font default), otherwise 0.4–1.0
  transparency: number; // 40–100 (%)
  cornerRadius: number; // 0–100 (% multiplier)
  animSpeed: number; // ms
  animations: AnimMode;
  showShadows: boolean;
  highContrast: boolean;
  // Time
  timezone: string; // 'local' | 'UTC' | 'GMT' | IANA zone
  hour12: boolean;
  showSeconds: boolean;
  showAMPM: boolean;
  leadingZero: boolean;
  showDate: boolean;
  extraClocks: string[]; // additional timezone clocks (0–3, main clock + up to 3 extras = 4 total)
  chime: boolean;
  // Window
  alwaysOnTop: boolean;
  clickThrough: boolean;
  rememberPosition: boolean;
  rememberSize: boolean;
  // Behavior
  launchAtStartup: boolean;
  rememberSettings: boolean;
  shareAcrossWindows: boolean;
  autoHideUI: boolean;
  autoScale: boolean;
  scale: number; // 0.5–2.5 manual scale
}

// Main clock + up to 3 additional clocks = 4 total.
export const MAX_EXTRA_CLOCKS = 3;

export const DEFAULTS: Settings = {
  theme: 'dark',
  autoTheme: false,
  accent: 'blue',
  font: 'inter',
  face: 'rounded',
  background: { type: 'theme', gradient: 'midnight', image: null },
  fontColor: 'auto',
  digitRatio: 0,
  transparency: 100,
  cornerRadius: 100,
  animSpeed: 320,
  animations: 'on',
  showShadows: true,
  highContrast: false,
  timezone: 'local',
  hour12: true,
  showSeconds: true,
  showAMPM: true,
  leadingZero: true,
  showDate: true,
  extraClocks: [],
  chime: false,
  alwaysOnTop: false,
  clickThrough: false,
  rememberPosition: true,
  rememberSize: true,
  launchAtStartup: false,
  rememberSettings: true,
  shareAcrossWindows: false,
  autoHideUI: true,
  autoScale: true,
  scale: 1,
};

// ─── UI presets ───────────────────────────────────────────────────────────────

export const THEMES: { id: ThemeId; label: string; dot: string; ring: string }[] = [
  { id: 'dark', label: 'Dark', dot: '#17171a', ring: '#ffffff' },
  { id: 'light', label: 'Light', dot: '#f2f2f4', ring: '#1d1d1f' },
  { id: 'oled', label: 'OLED', dot: '#000000', ring: '#ffffff' },
  { id: 'blue', label: 'Blue', dot: '#0d1626', ring: '#7ea6ff' },
  { id: 'green', label: 'Green', dot: '#0a1a10', ring: '#7fe6a4' },
  { id: 'amber', label: 'Amber', dot: '#211408', ring: '#ffc46b' },
  { id: 'rose', label: 'Rose', dot: '#2a1424', ring: '#ff9ecb' },
  { id: 'graphite', label: 'Graphite', dot: '#1c1c20', ring: '#e8e8ec' },
  { id: 'violet', label: 'Violet', dot: '#241040', ring: '#c79bff' },
  { id: 'teal', label: 'Teal', dot: '#05201c', ring: '#7fe8d4' },
  { id: 'copper', label: 'Copper', dot: '#291607', ring: '#ffb06b' },
  { id: 'navy', label: 'Navy', dot: '#0a1226', ring: '#8fb3ff' },
];

export const ACCENTS: { id: AccentId; label: string; hex: string }[] = [
  { id: 'blue', label: 'Blue', hex: '#3b82f6' },
  { id: 'purple', label: 'Purple', hex: '#a855f7' },
  { id: 'green', label: 'Green', hex: '#22c55e' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'red', label: 'Red', hex: '#ef4444' },
  { id: 'white', label: 'White', hex: '#f5f5f7' },
];

export const FONTS: { id: FontId; label: string; sample: string }[] = [
  { id: 'inter', label: 'Inter', sample: "'Inter', system-ui, sans-serif" },
  { id: 'sf', label: 'SF Pro', sample: "-apple-system, 'SF Pro Display', sans-serif" },
  { id: 'roboto', label: 'Roboto', sample: "'Roboto', system-ui, sans-serif" },
  { id: 'jetbrains', label: 'JetBrains Mono', sample: "'JetBrains Mono', monospace" },
  { id: 'din', label: 'DIN', sample: "'Oswald', 'DIN Alternate', sans-serif" },
  { id: 'bebas', label: 'Bebas Neue', sample: "'Bebas Neue', 'Oswald', sans-serif" },
];

export const FACES: { id: FaceId; label: string; hint: string }[] = [
  { id: 'rounded', label: 'Rounded', hint: 'Soft, bold, modern' },
  { id: 'sharp', label: 'Sharp', hint: 'Crisp, tight tracking' },
  { id: 'retro', label: 'Retro', hint: 'Vintage split-flap' },
  { id: 'minimal', label: 'Minimal', hint: 'Flat, airy, subtle' },
  { id: 'glass', label: 'Glass', hint: 'Frosted, translucent' },
  { id: 'neon', label: 'Neon', hint: 'Glowing accent digits' },
];

export const FONT_COLORS: { id: string; label: string; hex: string }[] = [
  { id: 'auto', label: 'Auto', hex: '' },
  { id: 'white', label: 'White', hex: '#ffffff' },
  { id: 'warm', label: 'Warm white', hex: '#f5f0e6' },
  { id: 'gold', label: 'Gold', hex: '#ffd54a' },
  { id: 'silver', label: 'Silver', hex: '#c6c6d0' },
  { id: 'blue', label: 'Blue', hex: '#7ea6ff' },
  { id: 'purple', label: 'Purple', hex: '#c084fc' },
  { id: 'green', label: 'Green', hex: '#86efac' },
  { id: 'red', label: 'Red', hex: '#f87171' },
  { id: 'pink', label: 'Pink', hex: '#f9a8d4' },
];

export const GRADIENTS: { id: string; label: string; css: string }[] = [
  { id: 'midnight', label: 'Midnight', css: 'linear-gradient(160deg, #0c0c14 0%, #191932 55%, #10101f 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(160deg, #03121c 0%, #0c3f61 60%, #0a2a3f 100%)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #050f08 0%, #134528 60%, #0b2a18 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(160deg, #1c0f2e 0%, #54203f 55%, #2e1b12 100%)' },
  { id: 'slate', label: 'Slate', css: 'linear-gradient(160deg, #101014 0%, #23232c 60%, #14141a 100%)' },
];

export const ANIM_MODES: { id: AnimMode; label: string }[] = [
  { id: 'on', label: 'Enabled' },
  { id: 'off', label: 'Disabled' },
  { id: 'reduced', label: 'Reduced motion' },
];

export const TIMEZONE_PRESETS: { id: string; label: string }[] = [
  { id: 'local', label: 'Local' },
  { id: 'UTC', label: 'UTC' },
  { id: 'GMT', label: 'GMT' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Asia/Manila', label: 'Manila' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'Australia/Sydney', label: 'Sydney' },
];

export function resolveTz(timezone: string): string | undefined {
  return timezone === 'local' ? undefined : timezone;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const OWN_PREFIX = 'flipclock:settings';
const SHARED_KEY = 'flipclock:settings:shared';
const INSTANCE_KEY = 'flipclock:instance';

function instanceId(): string {
  try {
    let id = sessionStorage.getItem(INSTANCE_KEY);
    if (!id) {
      id = `w-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(INSTANCE_KEY, id);
    }
    return id;
  } catch {
    return 'w-fallback';
  }
}

export function ownKey(): string {
  return `${OWN_PREFIX}:${instanceId()}`;
}

export function sharedKey(): string {
  return SHARED_KEY;
}

function mergeLoaded(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
  const p = raw as Partial<Settings> & { showSecondTz?: boolean; secondTz?: string; borderless?: boolean };
  // Drop legacy fields so they don't get re-persisted as stale keys.
  const { showSecondTz, secondTz, borderless, extraClocks: rawExtras, ...rest } = p;
  // Migrate the legacy single "second timezone" (showSecondTz + secondTz)
  // into the new extraClocks list so existing users keep their world clock.
  let extraClocks = Array.isArray(rawExtras) ? rawExtras.slice(0, MAX_EXTRA_CLOCKS) : [];
  if (extraClocks.length === 0 && showSecondTz && typeof secondTz === 'string' && secondTz) {
    extraClocks = [secondTz];
  }
  return {
    ...DEFAULTS,
    ...rest,
    extraClocks,
    background: { ...DEFAULTS.background, ...(rest.background ?? {}) },
  };
}

export function loadSettings(): Settings {
  try {
    const ownRaw = localStorage.getItem(ownKey());
    const own = ownRaw ? (JSON.parse(ownRaw) as Partial<Settings> | null) : null;
    if (own?.shareAcrossWindows) {
      const sharedRaw = localStorage.getItem(SHARED_KEY);
      if (sharedRaw) {
        return { ...mergeLoaded(JSON.parse(sharedRaw)), shareAcrossWindows: true };
      }
    }
    return own ? mergeLoaded(own) : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(s.shareAcrossWindows ? SHARED_KEY : ownKey(), JSON.stringify(s));
  } catch {
    /* storage full / private mode — ignore */
  }
}

export function readShared(): Settings | null {
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    return raw ? mergeLoaded(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
