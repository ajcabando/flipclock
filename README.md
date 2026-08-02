# Flip Clock

A modern, macOS-style **split-flip clock** web app. Dark matte background, huge
rounded flip cards, smooth CSS-only flip animations, glassmorphism settings —
built with React + TypeScript + Vite + Tailwind.

Runs in any browser and is ready to be packaged with **Electron** (skeleton
included) or **Tauri** for native features like *Always on Top*, *Borderless* and
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
- **12/24 hour**, leading zero, seconds / AM/PM / date toggles, second
  timezone mini-clock (world clock mode).
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
  plus always-on-top, click-through, borderless, opacity and remembered
  position/size.
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

Double-click anywhere on the clock to open settings.

## Desktop packaging

### macOS — installable .dmg (Apple Silicon / Intel / Universal)

```bash
npm install
npm run dist:mac        # builds the web app + produces the .dmg & .zip
```

Artifacts land in `release/`:

- `release/Flip Clock-1.0.0-arm64.dmg` — drag-to-Applications installer
- `release/Flip Clock-1.0.0-arm64-mac.zip` — portable archive
- `release/mac-arm64/Flip Clock.app` — unpacked bundle

The app is **unsigned** (no Apple Developer ID), so Gatekeeper may block the
first launch. Fix it once with:

- Right-click the app → **Open** → **Open**, or
- `xattr -dr com.apple.quarantine '/Applications/Flip Clock.app'`

`dist:mac` builds for your current Mac's chip. To target something else
(typically cross-building), pass an arch explicitly:

```bash
npx electron-builder --mac --x64       # Intel build from an Apple Silicon Mac
npx electron-builder --mac --universal # both chips in one app
```

### Code signing & notarization (removes the Gatekeeper warning)

The build config is **signing-ready**: `hardenedRuntime`, entitlements
(`build/entitlements.mac.plist`) and `dmg.sign` are enabled. If no signing
identity is found, builds stay unsigned (current behavior) — signing and
notarization kick in automatically once credentials are available.

**Required (only you can do this):**

1. Enroll in the **Apple Developer Program** (developer.apple.com, $99/yr).
2. In Xcode → Settings → Accounts (or the Developer portal), create a
   **Developer ID Application** certificate and install it in your keychain.
3. Export it as a **`.p12`** (Keychain Access → right-click → Export) with a
   password.
4. For notarization, generate an **app-specific password** at
   appleid.apple.com → Sign-In & Security → App-Specific Passwords.

**Locally**, sign + notarize with these env vars set:

```bash
export CSC_LINK="$(base64 < DeveloperID.p12)"   # or a file path
read -s CSC_KEY_PASSWORD && export CSC_KEY_PASSWORD
read -s APPLE_APP_SPECIFIC_PASSWORD && export APPLE_APP_SPECIFIC_PASSWORD
export APPLE_ID='you@example.com'
export APPLE_TEAM_ID='XXXXXXXXXX'
npm run dist:mac:universal
```

**In CI** (the release workflow), set these as repo secrets:

```
CSC_LINK                     # base64 of Developer ID Application .p12
CSC_KEY_PASSWORD             # .p12 password
APPLE_ID                     # Apple ID email
APPLE_APP_SPECIFIC_PASSWORD  # app-specific password
APPLE_TEAM_ID                # 10-char Team ID
```

Tag a release with all five set and the DMG ships **signed + notarized** —
Gatekeeper opens it without warnings. Without them, releases stay unsigned.

### Other targets

- `npm run dist:win` / `npm run dist:linux` — Windows / Linux builds
  (note: transparent + frameless windows behave differently there and are not
  tested).
- `npm run dist:mac:dir` — build only the unpacked `.app` (no DMG), handy for
  quick iteration.

### Manual Electron dev run (optional)

```bash
# (electron is already a devDependency — only run this if it's missing)
npm i -D electron concurrently wait-on
# dev: npm run dev in one terminal, then:
npx electron desktop/electron/main.cjs
# prod: npm run build, then run main.cjs without VITE_DEV_SERVER_URL
```

`desktop/electron/main.cjs` wires *Always on Top*, *Click Through*,
*Borderless*, window opacity, size & position; `preload.cjs` exposes
`window.desktopAPI`, which the app detects automatically
(`src/lib/desktop.ts`). The window is transparent + frameless for the floating
widget look; the top bar is a drag region.

### Tauri

Map the `DesktopBridge` calls in `src/lib/desktop.ts` to
`@tauri-apps/api/window` (`setAlwaysOnTop`, `setIgnoreCursorEvents` for click
through, `setDecorations` for borderless, `setOpacity`). Expose it as
`window.desktopAPI` via `invoke_handler` or a `withGlobalTauri` command
wrapper, and the UI lights up the desktop toggles automatically.

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
