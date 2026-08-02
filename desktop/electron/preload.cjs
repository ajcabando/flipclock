// ─── Electron preload — exposes the desktop bridge to the renderer ───────────
// The renderer detects it via `window.desktopAPI` (see src/lib/desktop.ts).

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  setAlwaysOnTop: (v) => ipcRenderer.send('win:alwaysOnTop', v),
  setClickThrough: (v) => ipcRenderer.send('win:clickThrough', v),
  setBorderless: (v) => ipcRenderer.send('win:borderless', v),
  setWindowOpacity: (v) => ipcRenderer.send('win:opacity', v),
  setWindowSize: (w, h) => ipcRenderer.send('win:size', w, h),
  setWindowPosition: (x, y) => ipcRenderer.send('win:position', x, y),
  setLaunchAtStartup: (v) => ipcRenderer.send('win:launchAtStartup', v),
  minimize: () => ipcRenderer.send('win:minimize'),
  quit: () => ipcRenderer.send('win:quit'),
});
