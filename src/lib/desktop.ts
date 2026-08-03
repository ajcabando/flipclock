// ─── Desktop bridge (Tauri) ─────────────────────────────────────────────────
// The web app runs fully in a browser. When packaged with Tauri, these calls
// become live window operations; in the browser they are safe no-ops and the
// UI marks these features as "desktop only".

import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { disable as autostartDisable, enable as autostartEnable } from '@tauri-apps/plugin-autostart';

export interface WindowGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SessionWindow extends WindowGeometry {
  label: string;
}

export interface DesktopBridge {
  setAlwaysOnTop(v: boolean): void;
  setClickThrough(v: boolean): void;
  setWindowSize(w: number, h: number): void;
  setWindowPosition(x: number, y: number): void;
  setDecorations(v: boolean): void;
  setLaunchAtStartup(v: boolean): void;
  minimize(): void;
  close(): void;
}

export const isDesktop = typeof window !== 'undefined' && isTauri();

/** True when running on Windows (desktop build or browser) — used to pick
 * the ⌘ vs Ctrl modifier shown in shortcut hints. */
export const isWindows =
  typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

const noop: DesktopBridge = {
  setAlwaysOnTop() {},
  setClickThrough() {},
  setWindowSize() {},
  setWindowPosition() {},
  setDecorations() {},
  setLaunchAtStartup() {},
  minimize() {},
  close() {},
};

function tauriBridge(): DesktopBridge {
  const win = getCurrentWindow();
  return {
    setAlwaysOnTop(v) {
      void win.setAlwaysOnTop(v);
    },
    setClickThrough(v) {
      // Ignore-cursor-events support varies by platform/version — swallow any
      // rejection instead of leaking an unhandled promise error.
      void win.setIgnoreCursorEvents(v).catch(() => {});
    },
    setWindowSize(w, h) {
      void win.setSize(new LogicalSize(w, h));
    },
    setWindowPosition(x, y) {
      void win.setPosition(new LogicalPosition(x, y));
    },
    setDecorations(v) {
      void win.setDecorations(v);
    },
    setLaunchAtStartup(v) {
      void (v ? autostartEnable() : autostartDisable());
    },
    minimize() {
      void win.minimize();
    },
    close() {
      void win.close();
    },
  };
}

export function bridge(): DesktopBridge {
  return isDesktop ? tauriBridge() : noop;
}

// ─── Window manager API (Rust commands) ──────────────────────────────────────

/** Stable window label — the frontend keys per-window settings on it. */
export function getWindowLabel(): string {
  return isDesktop ? getCurrentWindow().label : '';
}

/**
 * Creates a new clock window. `label` is required when restoring a session
 * (the window then reuses its saved settings key); geometry is optional
 * (Rust cascades fresh windows).
 */
export function createWindow(label?: string, geo?: Partial<WindowGeometry>): Promise<string> {
  return invoke<string>('create_window', {
    label: label ?? null,
    x: geo?.x ?? null,
    y: geo?.y ?? null,
    w: geo?.w ?? null,
    h: geo?.h ?? null,
  });
}

/** Every window saved in the session file (label + logical geometry). */
export async function loadSession(): Promise<SessionWindow[]> {
  try {
    return await invoke<SessionWindow[]>('load_session');
  } catch {
    return [];
  }
}

/** Menu → Duplicate Window hands the action to the focused window's webview. */
export function onMenuDuplicate(cb: () => void): Promise<UnlistenFn> {
  return listen('menu-duplicate', cb);
}
