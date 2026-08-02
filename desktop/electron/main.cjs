// ─── Electron main process (packaging skeleton) ──────────────────────────────
// The web app runs fine in any browser. To get a native desktop app:
//
//   npm i -D electron concurrently wait-on
//   npx electron desktop/electron/main.cjs   (after `npm run dev` on :5173)
//
// For production: `npm run build`, then load dist/index.html (VITE_DEV_SERVER_URL unset).
// macOS tips: transparent + frame:false gives a floating widget look; the
// window can still be dragged thanks to -webkit-app-region:drag on the top bar.

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const DEV_URL = process.env.VITE_DEV_SERVER_URL; // e.g. http://localhost:5173

let win = null;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    width: 540,
    height: 360,
    x: workArea.x + workArea.width - 600,
    y: workArea.y + 60,
    minWidth: 220,
    minHeight: 140,
    frame: false, // Borderless by default — perfect floating desktop clock
    transparent: true, // macOS: enables the transparency slider
    backgroundColor: '#00000000',
    resizable: true,
    hasShadow: true,
    title: 'Flip Clock',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadFile(path.join(__dirname, '../../dist/index.html'));

  win.on('closed', () => {
    win = null;
  });
}

ipcMain.on('win:alwaysOnTop', (_e, v) => {
  if (win) win.setAlwaysOnTop(!!v);
});

ipcMain.on('win:clickThrough', (_e, v) => {
  if (win) win.setIgnoreMouseEvents(!!v, { forward: true });
});

ipcMain.on('win:borderless', (_e, v) => {
  if (!win) return;
  if (v) {
    win.setMenuBarVisibility(false);
    win.setAutoHideMenuBar(true);
  } else {
    win.setMenuBarVisibility(true);
  }
});

ipcMain.on('win:opacity', (_e, v) => {
  if (win) win.setOpacity(Math.max(0.4, Math.min(1, Number(v))));
});

ipcMain.on('win:size', (_e, w, h) => {
  if (win) win.setSize(Math.round(Number(w)), Math.round(Number(h)));
});

ipcMain.on('win:position', (_e, x, y) => {
  if (win) win.setPosition(Math.round(Number(x)), Math.round(Number(y)));
});

ipcMain.on('win:launchAtStartup', (_e, v) => {
  // macOS: registers/unregisters the app in System Settings → Login Items.
  try {
    app.setLoginItemSettings({ openAtLogin: !!v });
  } catch {
    /* not supported in this dev context — ignore */
  }
});

ipcMain.on('win:minimize', () => {
  if (win) win.minimize();
});

ipcMain.on('win:quit', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
