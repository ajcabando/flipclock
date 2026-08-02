// ─── Desktop bridge (Tauri) ─────────────────────────────────────────────────
// The web app runs fully in a browser. When packaged with Tauri, these calls
// become live window operations; in the browser they are safe no-ops and the
// UI marks these features as "desktop only".

import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { disable as autostartDisable, enable as autostartEnable } from '@tauri-apps/plugin-autostart';

export interface DesktopBridge {
  setAlwaysOnTop(v: boolean): void;
  setClickThrough(v: boolean): void;
  setWindowOpacity(v: number): void;
  setWindowSize(w: number, h: number): void;
  setWindowPosition(x: number, y: number): void;
  setLaunchAtStartup(v: boolean): void;
  minimize(): void;
  quit(): void;
}

export const isDesktop = typeof window !== 'undefined' && isTauri();

const noop: DesktopBridge = {
  setAlwaysOnTop() {},
  setClickThrough() {},
  setWindowOpacity() {},
  setWindowSize() {},
  setWindowPosition() {},
  setLaunchAtStartup() {},
  minimize() {},
  quit() {},
};

function tauriBridge(): DesktopBridge {
  const win = getCurrentWindow();
  return {
    setAlwaysOnTop(v) {
      void win.setAlwaysOnTop(v);
    },
    setClickThrough(v) {
      void win.setIgnoreCursorEvents(v);
    },
    // Tauri v2 has no native window-opacity API (Rust or JS), and the window
    // is transparent — the CSS `--window-opacity` on .app already fades the
    // whole app, which reads as true window transparency. Nothing to do here.
    setWindowOpacity() {},
    setWindowSize(w, h) {
      void win.setSize(new LogicalSize(w, h));
    },
    setWindowPosition(x, y) {
      void win.setPosition(new LogicalPosition(x, y));
    },
    setLaunchAtStartup(v) {
      void (v ? autostartEnable() : autostartDisable());
    },
    minimize() {
      void win.minimize();
    },
    quit() {
      void win.close();
    },
  };
}

export function bridge(): DesktopBridge {
  return isDesktop ? tauriBridge() : noop;
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

// Desktop-only window bounds tracking. The browser never emits move/resize
// events for an OS window, so the desktop shell does it and persists the
// bounds — App.tsx then restores them on launch via loadBounds().
let boundsTracked = false;

export function trackWindowBounds(): void {
  if (!isDesktop || boundsTracked) return;
  boundsTracked = true;
  const win = getCurrentWindow();
  const save = async () => {
    try {
      // outerPosition/outerSize are physical pixels; convert to logical so the
      // restore path (LogicalPosition/LogicalSize) is correct on Retina.
      const [pos, size, scale] = await Promise.all([
        win.outerPosition(),
        win.outerSize(),
        win.scaleFactor(),
      ]);
      saveBounds(pos.x / scale, pos.y / scale, size.width / scale, size.height / scale);
    } catch {
      /* ignore */
    }
  };
  void win.onMoved(save);
  void win.onResized(save);
}
