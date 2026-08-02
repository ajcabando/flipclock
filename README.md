# Flip Clock

A modern, macOS-style **split-flip clock** web app. Dark matte background, huge
rounded flip cards, smooth CSS-only flip animations, glassmorphism settings —
built with React + TypeScript + Vite + Tailwind.

Runs in any browser and is packaged as a native macOS app with **Tauri v2**
(small, fast, low-memory) for native features like *Always on Top* and
*Click Through*.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run preview    # serve the production build
```

## Features

- **Flip clock** — hours & minutes as split-flap cards (pure CSS `rotateX`,
  no libraries), blinking colon, small animated seconds counter bottom-right,
  AM/PM bottom-left (reference layout).
- **Fully resizable** — everything scales with `clamp()`; auto-scale keeps the
  clock fitting the window; manual scale with `+`/`-`.
- **Multiple independent instances** — every window has its own settings key
  (session-scoped). Enable *Share across windows* for live synced settings.
- **Timezones** — Local, UTC, GMT and every IANA zone via
  `Intl.DateTimeFormat` (no external APIs), with presets + search.
- **12/24 hour**, leading zero, seconds / AM/PM / date toggles, and a
  **world-clock grid** — add up to 4 extra timezone clocks (5 total) in a
  responsive 2×2 grid of glass flip-clock cards with live times and city
  labels.
- **12 themes** (Dark, Light, OLED, Blue, Green, Amber, Rose, Graphite,
  Violet, Teal, Copper, Navy), **6 accent colors** (glow + active controls),
  **custom digit color** (presets + color picker), **6 fonts**, **6 clock
  faces** (Rounded, Sharp, Retro, Minimal, Glass, Neon), gradient &
  custom-image backgrounds, transparency 40–100%, rounded-corner and shadow
  controls.
- **Animations** — Enabled / Disabled / Reduced-motion (follows the OS);
  speed 100–800 ms.
- **Auto-hide UI** — chrome fades after 3 s of mouse idle.
- **Fullscreen** (F), hourly **chime** (Web Audio, synthesized), date display,
  auto light/dark theme, high-contrast mode.
- **Launch at startup** — registers with macOS Login Items (desktop build),
  plus always-on-top, click-through, opacity and remembered position/size.
- **Persistence** — everything is stored in `localStorage` per instance.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `F` | Toggle fullscreen |
| `T` | Toggle dark / light theme |
| `S` | Toggle seconds |
| `D` | Toggle date |
| `M` | Toggle 12 / 24 hour |
| `H` | Toggle auto-hide UI |
| `A` | Always on top (desktop build) |
| `+` / `−` | Increase / decrease clock size |
| `R` | Reset window |
| `Esc` | Exit fullscreen / close settings |

**Drag the window anywhere** to move it. To open Settings, **hover the
**top-right corner** — a gear button fades in (click it). The gear is the
reliable way to open Settings in the desktop build: the whole window is a
drag region, which swallows double-clicks (double-click still opens Settings
in the browser build).

## Changelog

### v1.1.0 — Tauri native app

- **Electron → Tauri v2** — the app is now a native macOS app built with
  Tauri: ~100× smaller installer (DMG ≈ 2 MB vs 209 MB), faster startup and
  far lower memory use.
- **Frameless + clean** — no title bar and no top bar: just the floating
  clock.
- **Drag + Settings fix** — the whole window is a Tauri drag region
  (previously only the clock face dragged, and the background couldn't), and
  a hover-revealed **gear button** replaced double-click as the reliable way
  to open Settings (dragging swallows double-clicks; the gear is
  keyboard-focusable and always visible on touch devices; double-click still
  works in the browser build).
- **World-clock grid** — up to 4 additional timezone clocks (5 total) in a
  responsive 2×2 grid of glass flip-clock cards.
- **Mini flip clocks** — the additional timezone clocks are now scaled-down
  flip clocks (~40% of the main clock): their own split-flap animation,
  blinking colon and timezone label — bigger than before, always smaller than
  the main clock.
- **Rounded corners** — the frameless window has 22px rounded corners; in the
  transparent Tauri window the desktop shows through the cutouts.
- Plus the existing 12 themes, 6 accents, 6 faces, custom digit colors,
  gradients/images, chime, autostart, always-on-top and click-through.

## Desktop packaging (Tauri v2)

### Prerequisites

- **Rust** (`rustup` — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, ≥ 1.85 for `edition2024` deps)
- **Xcode Command Line Tools** (`xcode-select --install`)
- **create-dmg** (`brew install create-dmg`) — required for the `.dmg` bundle
- Node deps: `npm install`

> **Releasing:** a new version requires bumping **package.json**, **Cargo.toml**
> and **tauri.conf.json** in lockstep — the release workflow validates the tag
> against `tauri.conf.json` only.

### Dev run (live-reload native window)

```bash
npm run tauri:dev   # vite dev server + native window
```

### macOS — installable .dmg

```bash
npm run dist:mac               # builds for your current Mac's chip
npm run dist:mac:universal     # universal build — runs on Intel + Apple Silicon
npm run dist:mac:dir           # just the unpacked .app (no DMG)
```

Artifacts land under `src-tauri/target/…/release/bundle/`:

- `bundle/dmg/Flip Clock_<version>_<arch>.dmg` — drag-to-Applications installer
- `bundle/macos/Flip Clock.app` + `.app.tar.gz` — app bundle / archive

The app is **unsigned** (no Apple Developer ID), so Gatekeeper may block the
first launch. Fix it once with:

- Right-click the app → **Open** → **Open**, or
- `xattr -dr com.apple.quarantine '/Applications/Flip Clock.app'`

### Code signing & notarization (removes the Gatekeeper warning)

The build is **signing-ready** — Tauri picks up credentials from env vars. If
none are set, builds stay unsigned (current behavior).

> **Note:** full **Xcode** is required for the steps below (creating/exporting
> the certificate and local notarization tooling) — Command Line Tools alone
> are not enough. CI is unaffected (GitHub runners ship full Xcode).

**Required (only you can do this):**

1. Enroll in the **Apple Developer Program** (developer.apple.com, $99/yr).
2. In Xcode → Settings → Accounts (or the Developer portal), create a
   **Developer ID Application** certificate and install it in your keychain.
3. Export it as a **`.p12`** (Keychain Access → right-click → Export) with a
   password.
4. For notarization, generate an **app-specific password** at
   appleid.apple.com → Sign-In & Security → App-Specific Passwords.

**Locally**, sign + notarize with these env vars set (Tauri's names):

```bash
export APPLE_CERTIFICATE="$(base64 < DeveloperID.p12)"
read -s APPLE_CERTIFICATE_PASSWORD && export APPLE_CERTIFICATE_PASSWORD
read -s APPLE_PASSWORD && export APPLE_PASSWORD   # app-specific password
export APPLE_ID='you@example.com'
export APPLE_TEAM_ID='XXXXXXXXXX'
npm run dist:mac:universal
```

**In CI** (the release workflow), set these as repo secrets:

```
APPLE_CERTIFICATE            # base64 of Developer ID Application .p12
APPLE_CERTIFICATE_PASSWORD   # .p12 password
APPLE_ID                     # Apple ID email
APPLE_PASSWORD               # app-specific password
APPLE_TEAM_ID                # 10-char Team ID
```

Tag a release with all five set and the DMG ships **signed + notarized** —
Gatekeeper opens it without warnings. Without them, releases stay unsigned.

> **Tip:** keep the `.p12` password free of shell metacharacters
> (`" $ \`` backslashes, newlines) — the CI step that loads it validates the
> other credentials in a shell context, so exotic passwords could break it.

### How the desktop bridge works

`src/lib/desktop.ts` exposes a `DesktopBridge` that maps to `@tauri-apps/api`
in the packaged app (`getCurrentWindow()` + the autostart plugin) and is a
safe no-op in the browser. It wires *Always on Top*, *Click Through*
(`setIgnoreCursorEvents`), window opacity, size & position, launch-at-startup,
and bounds persistence. The window is transparent + frameless for the floating
widget look (macOS transparency needs `app.macOSPrivateApi: true` in
`tauri.conf.json` — a private API, so the app can't be submitted to the Mac
App Store; fine for direct distribution); the **whole window** carries
`data-tauri-drag-region` so it drags the window from anywhere (the attribute is removed while the Settings
panel is open so the modal works normally). Dragging swallows double-clicks,
so a hover-revealed **gear button** in the top-right corner is the reliable
way to open Settings (buttons stay clickable inside Tauri drag regions). Rust
side: `src-tauri/src/lib.rs` registers the autostart plugin; window
permissions live in `src-tauri/capabilities/default.json`.

## Architecture

```
src/
  App.tsx                     — shell: theming, shortcuts, fullscreen, chime
  context/SettingsContext.tsx — settings state + per-instance persistence
  lib/                        — settings/store, time (Intl), desktop bridge, chime
  hooks/                      — useNow, useAutoHide, useSystemPrefs, useFullscreen
  components/                 — Clock, FlipCard, SecondsCounter, AMPMIndicator,
                                DateDisplay, SettingsPanel, TimezoneSelector, ui
```

Performance notes: the tick is aligned to second boundaries, `FlipCard` is
memoized so only changed digits re-render/flip, the settings panel is
lazy-loaded, and all animation is CSS-only for smooth 60 fps flips.
