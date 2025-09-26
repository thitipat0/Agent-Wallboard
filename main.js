const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow, tray;

// สร้าง window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // สร้าง system tray (Lab 8.3)
  createTray();
}

// System Tray (Lab 8.3 หัวใจหลัก)
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon.ico'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Hide', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

// IPC Handlers (Lab 8.2 หัวใจหลัก)
ipcMain.handle('get-agents', async () => {
  // จำลองข้อมูล agents
  return [
    { id: 1, name: 'John Smith', status: 'available' },
    { id: 2, name: 'Jane Doe', status: 'busy' },
    { id: 3, name: 'Mike Johnson', status: 'offline' }
  ];
});

ipcMain.handle('update-agent-status', async (event, agentId, status) => {
  // แจ้งเตือน (Lab 8.3)
  new Notification({
    title: 'Status Updated',
    body: `Agent ${agentId} is now ${status}`
  }).show();
  
  return { success: true };
});

// File Export (Lab 8.3 หัวใจหลัก)
ipcMain.handle('export-data', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'agents-export.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  
  if (!result.canceled) {
    // แปลงเป็น CSV
    const csv = data.map(agent => `${agent.name},${agent.status}`).join('\n');
    fs.writeFileSync(result.filePath, `Name,Status\n${csv}`);
    return { success: true, path: result.filePath };
  }
  
  return { success: false };
});

// API Call (Lab 8.4 หัวใจหลัก)
ipcMain.handle('api-call', async (event, url) => {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});