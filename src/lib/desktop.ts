// ─── Desktop bridge ──────────────────────────────────────────────────────────
// The web app runs fully in a browser. When packaged with Electron or Tauri,
// the wrapper exposes `window.desktopAPI` (see desktop/electron/preload.cjs)
// and these calls become live. In the browser they are safe no-ops; the UI
// marks these features as "desktop only".

export interface DesktopBridge {
  setAlwaysOnTop(v: boolean): void;
  setClickThrough(v: boolean): void;
  setBorderless(v: boolean): void;
  setWindowOpacity(v: number): void;
  setWindowSize(w: number, h: number): void;
  setWindowPosition(x: number, y: number): void;
  setLaunchAtStartup(v: boolean): void;
  minimize(): void;
  quit(): void;
}

declare global {
  interface Window {
    desktopAPI?: DesktopBridge;
  }
}

export const isDesktop = typeof window !== 'undefined' && !!window.desktopAPI;

const noop: DesktopBridge = {
  setAlwaysOnTop() {},
  setClickThrough() {},
  setBorderless() {},
  setWindowOpacity() {},
  setWindowSize() {},
  setWindowPosition() {},
  setLaunchAtStartup() {},
  minimize() {},
  quit() {},
};

export function bridge(): DesktopBridge {
  return window.desktopAPI ?? noop;
}

// Window bounds memory (used by the desktop build to restore position/size).
const BOUNDS_KEY = 'flipclock:bounds';

export function saveBounds(x: number, y: number, w: number, h: number): void {
  try {
    localStorage.setItem(BOUNDS_KEY, JSON.stringify({ x, y, w, h }));
  } catch {
    /* ignore */
  }
}

export function loadBounds(): { x: number; y: number; w: number; h: number } | null {
  try {
    const raw = localStorage.getItem(BOUNDS_KEY);
    return raw ? (JSON.parse(raw) as { x: number; y: number; w: number; h: number }) : null;
  } catch {
    return null;
  }
}
