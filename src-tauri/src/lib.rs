// ─── Flip Clock — Tauri window manager ──────────────────────────────────────
// One flip clock per native window. The File menu creates/duplicates/closes
// independent clock windows; every window has a stable label (used by the
// frontend as its settings key), and a session file records each window's
// geometry so "Restore Previous Session" can recreate the set on launch.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Instant;

#[cfg(target_os = "macos")]
use tauri::menu::{Menu, MenuItemBuilder, PredefinedMenuItem, Submenu};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, RunEvent, WebviewUrl,
    WebviewWindowBuilder, WindowEvent,
};
// `Runtime` is only used by the macOS-only menu builder.
#[cfg(target_os = "macos")]
use tauri::Runtime;
use tauri_plugin_autostart::MacosLauncher;

const SESSION_FILE: &str = "session.json";

// ─── Session model ───────────────────────────────────────────────────────────

#[derive(Clone, Serialize, Deserialize)]
struct WindowGeometry {
    x: f64,
    y: f64,
    w: f64,
    h: f64,
}

#[derive(Clone, Serialize, Deserialize)]
struct SessionData {
    windows: HashMap<String, WindowGeometry>,
}

impl Default for SessionData {
    fn default() -> Self {
        Self {
            windows: HashMap::new(),
        }
    }
}

struct SessionState {
    data: SessionData,
    last_save: Instant,
    quitting: bool, // set on app exit so Destroyed keeps the session intact
    next_label: u64,
}

fn session_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_data_dir().ok()?;
    Some(dir.join(SESSION_FILE))
}

fn read_session(app: &AppHandle) -> SessionData {
    match session_path(app).and_then(|p| fs::read_to_string(p).ok()) {
        Some(raw) => serde_json::from_str(&raw).unwrap_or_default(),
        None => SessionData::default(),
    }
}

fn write_session(app: &AppHandle, data: &SessionData) {
    if let Some(path) = session_path(app) {
        if let Some(dir) = path.parent() {
            let _ = fs::create_dir_all(dir);
        }
        let _ = fs::write(path, serde_json::to_string_pretty(data).unwrap_or_default());
    }
}

/// Reads a window's current geometry (outer position/size in logical pixels)
/// and stores it in the session map.
fn record_geometry(
    label: &str,
    pos: Result<PhysicalPosition<i32>, tauri::Error>,
    size: Result<PhysicalSize<u32>, tauri::Error>,
    scale: Result<f64, tauri::Error>,
    map: &mut HashMap<String, WindowGeometry>,
) {
    if let (Ok(p), Ok(s), Ok(sc)) = (pos, size, scale) {
        map.insert(
            label.to_string(),
            WindowGeometry {
                x: p.x as f64 / sc,
                y: p.y as f64 / sc,
                w: s.width as f64 / sc,
                h: s.height as f64 / sc,
            },
        );
    }
}

// ─── Window creation ─────────────────────────────────────────────────────────

/// Spawns a new frameless, transparent clock window. `label` may be supplied
/// by the caller (session restore, which needs the label to restore the
/// window's settings); otherwise a unique one is generated.
fn spawn_window(
    app: &AppHandle,
    label: Option<String>,
    geo: Option<&WindowGeometry>,
) -> tauri::Result<String> {
    let label = match label {
        Some(l) => l,
        None => {
            let state = app.state::<Mutex<SessionState>>();
            let mut s = state.lock().unwrap();
            let label = loop {
                let candidate = format!("clock-{}", s.next_label);
                s.next_label += 1;
                if !app.webview_windows().contains_key(&candidate) {
                    break candidate;
                }
            };
            label
        }
    };

    let count = app.webview_windows().len() as f64;
    let (x, y, w, h) = match geo {
        Some(g) => (g.x, g.y, g.w, g.h),
        // Cascade new windows a little from the top-left corner.
        None => (60.0 + count * 24.0, 60.0 + count * 24.0, 540.0, 360.0),
    };

    let win = WebviewWindowBuilder::new(app, label.clone(), WebviewUrl::App("index.html".into()))
        .title("Flip Clock")
        .inner_size(w, h)
        .position(x, y)
        .min_inner_size(220.0, 140.0)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .build()?;

    // Record the window so the session file reflects it immediately.
    let state = app.state::<Mutex<SessionState>>();
    let mut s = state.lock().unwrap();
    record_geometry(
        &label,
        win.outer_position(),
        win.outer_size(),
        win.scale_factor(),
        &mut s.data.windows,
    );
    let data = s.data.clone();
    drop(s);
    write_session(app, &data);
    Ok(label)
}

// ─── Menu ────────────────────────────────────────────────────────────────────
// macOS only: the app menu lives in the global menu bar, and several
// PredefinedMenuItems it uses (About, Hide, Hide Others, Show All) exist only
// on macOS. On Windows the clock windows are frameless, so a native menu bar
// wouldn't render anyway — the frontend handles the same shortcuts (Ctrl+N,
// Ctrl+Shift+N, Ctrl+W) directly, and WebView2 supplies the Edit shortcuts.

#[cfg(target_os = "macos")]
fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let new_window = MenuItemBuilder::with_id("new-window", "New Clock Window")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let duplicate_window = MenuItemBuilder::with_id("duplicate-window", "Duplicate Window")
        .accelerator("CmdOrCtrl+Shift+N")
        .build(app)?;
    let close_window = MenuItemBuilder::with_id("close-window", "Close Window")
        .accelerator("CmdOrCtrl+W")
        .build(app)?;

    let app_menu = Submenu::new(app, "Flip Clock", true)?;
    app_menu.append_items(&[
        &PredefinedMenuItem::about(app, None, None)?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::hide(app, None)?,
        &PredefinedMenuItem::hide_others(app, None)?,
        &PredefinedMenuItem::show_all(app, None)?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::quit(app, None)?,
    ])?;

    let file_menu = Submenu::new(app, "File", true)?;
    file_menu.append_items(&[
        &new_window,
        &duplicate_window,
        &PredefinedMenuItem::separator(app)?,
        &close_window,
    ])?;

    let edit_menu = Submenu::new(app, "Edit", true)?;
    edit_menu.append_items(&[
        &PredefinedMenuItem::undo(app, None)?,
        &PredefinedMenuItem::redo(app, None)?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::cut(app, None)?,
        &PredefinedMenuItem::copy(app, None)?,
        &PredefinedMenuItem::paste(app, None)?,
        &PredefinedMenuItem::select_all(app, None)?,
    ])?;

    let window_menu = Submenu::new(app, "Window", true)?;
    window_menu.append_items(&[&PredefinedMenuItem::minimize(app, None)?])?;

    let menu: Menu<R> = Menu::new(app)?;
    menu.append_items(&[&app_menu, &file_menu, &edit_menu, &window_menu])?;
    Ok(menu)
}

// ─── Commands (invoked from the frontend) ────────────────────────────────────

/// Creates a new clock window. `label` is required when restoring a session
/// (so the window reuses its saved settings key); geometry is optional.
#[tauri::command]
fn create_window(
    app: AppHandle,
    label: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
    w: Option<f64>,
    h: Option<f64>,
) -> Result<String, String> {
    let geo = (x.is_some() || y.is_some() || w.is_some() || h.is_some()).then(|| WindowGeometry {
        x: x.unwrap_or(60.0),
        y: y.unwrap_or(60.0),
        w: w.unwrap_or(540.0),
        h: h.unwrap_or(360.0),
    });
    spawn_window(&app, label, geo.as_ref()).map_err(|e| e.to_string())
}

/// Returns every window saved in the session file (label + logical geometry).
#[tauri::command]
fn load_session(app: AppHandle) -> Vec<SessionWindow> {
    read_session(&app)
        .windows
        .into_iter()
        .map(|(label, g)| SessionWindow {
            label,
            x: g.x,
            y: g.y,
            w: g.w,
            h: g.h,
        })
        .collect()
}

#[derive(Serialize)]
struct SessionWindow {
    label: String,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
}

// ─── App setup ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // setup receives &mut App; the helpers below take &AppHandle.
            let handle = app.handle();
            let max_label = app
                .webview_windows()
                .keys()
                .filter_map(|l| l.strip_prefix("clock-").and_then(|s| s.parse::<u64>().ok()))
                .max()
                .unwrap_or(0);
            let mut state = SessionState {
                data: read_session(handle),
                last_save: Instant::now(),
                quitting: false,
                next_label: max_label + 1,
            };
            for (label, win) in app.webview_windows() {
                // Keep the previous session's saved geometry for labels we
                // already know; the frontend re-applies it after boot. Only
                // seed fresh labels (e.g. a brand-new main window).
                if !state.data.windows.contains_key(&label) {
                    record_geometry(
                        &label,
                        win.outer_position(),
                        win.outer_size(),
                        win.scale_factor(),
                        &mut state.data.windows,
                    );
                }
            }
            let data = state.data.clone();
            app.manage(Mutex::new(state));
            write_session(handle, &data);
            #[cfg(target_os = "macos")]
            {
                let menu = build_menu(handle)?;
                app.set_menu(menu)?;
            }
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "new-window" => {
                let _ = spawn_window(app, None, None);
            }
            // Duplication needs the source window's settings, which live in
            // its webview — hand the action back to the focused window.
            "duplicate-window" => {
                let focused = app
                    .webview_windows()
                    .into_iter()
                    .find(|(_, w)| w.is_focused().unwrap_or(false));
                if let Some((_, win)) = focused {
                    let _ = win.emit("menu-duplicate", ());
                }
            }
            "close-window" => {
                let focused = app
                    .webview_windows()
                    .into_iter()
                    .find(|(_, w)| w.is_focused().unwrap_or(false));
                if let Some((_, win)) = focused {
                    let _ = win.close();
                }
            }
            _ => {}
        })
        .on_window_event(|window, event| match event {
            WindowEvent::Moved(_) | WindowEvent::Resized(_) => {
                let handle = window.app_handle();
                let state = handle.state::<Mutex<SessionState>>();
                let mut s = state.lock().unwrap();
                record_geometry(
                    window.label(),
                    window.outer_position(),
                    window.outer_size(),
                    window.scale_factor(),
                    &mut s.data.windows,
                );
                // Throttle disk writes during drags/resizes.
                if s.last_save.elapsed().as_millis() > 400 {
                    s.last_save = Instant::now();
                    let app = window.app_handle().clone();
                    let data = s.data.clone();
                    drop(s);
                    write_session(&app, &data);
                }
            }
            WindowEvent::Destroyed => {
                let app = window.app_handle().clone();
                let label = window.label().to_string();
                let state = app.state::<Mutex<SessionState>>();
                let mut s = state.lock().unwrap();
                // On a real quit the session was already snapshotted in the
                // exit handler — don't wipe windows the user had open.
                if !s.quitting {
                    s.data.windows.remove(&label);
                    let data = s.data.clone();
                    drop(s);
                    write_session(&app, &data);
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![create_window, load_session])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Snapshot every live window's geometry as the app exits so
            // "Restore Previous Session" survives restarts, and mark the
            // session as quitting so Destroyed keeps it intact.
            if let RunEvent::ExitRequested { .. } = event {
                let state = app.state::<Mutex<SessionState>>();
                let mut s = state.lock().unwrap();
                s.quitting = true;
                for (label, win) in app.webview_windows() {
                    record_geometry(
                        &label,
                        win.outer_position(),
                        win.outer_size(),
                        win.scale_factor(),
                        &mut s.data.windows,
                    );
                }
                let data = s.data.clone();
                drop(s);
                write_session(app, &data);
            }
        });
}
