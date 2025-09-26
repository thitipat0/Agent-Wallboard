const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow, tray;

// สร้าง window และจัดการ logic ทั้งหมดในฟังก์ชันนี้
function createWindow() {
  // สร้าง BrowserWindow
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload file อยู่ในโฟลเดอร์เดียวกันกับ main.js
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // กำหนดเส้นทางไฟล์สำหรับ icon และ index.html ให้ถูกต้องในทุกโหมด
  const isPackaged = app.isPackaged;
  const basePath = isPackaged ? process.resourcesPath : __dirname;
  
  let indexPath = path.join(basePath, 'index.html');
  let iconPath = path.join(basePath, 'assets', 'icon.svg');

  // ถ้าเป็นโหมด Build, ให้ระบุเส้นทาง app.asar
  if (isPackaged) {
    indexPath = path.join(basePath, 'app.asar', 'index.html');
    iconPath = path.join(basePath, 'app.asar', 'assets', 'icon.svg');
  }

  // Load icon
  try {
    if (fs.existsSync(iconPath)) {
      mainWindow.setIcon(iconPath);
    } else {
      console.error('Icon file not found at:', iconPath);
    }
  } catch (error) {
    console.error('Failed to set icon:', error.message);
  }

  // Load index.html
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath)
    .then(() => {
        // เปิด DevTools สำหรับโหมดพัฒนา
        if (!isPackaged) {
          mainWindow.webContents.openDevTools();
        }
      })
      .catch(err => {
        dialog.showErrorBox('File Load Error', `Failed to load index.html: ${err.message}`);
      });
  } else {
    dialog.showErrorBox('Error', `Could not find index.html at: ${indexPath}`);
    return;
  }

  createTray();
}

// System Tray (Lab 8.3 หัวใจหลัก)
function createTray() {
  const isPackaged = app.isPackaged;
  const basePath = isPackaged ? process.resourcesPath : __dirname;
  
  let iconPath = path.join(basePath, 'assets', 'icon.svg');

  if (isPackaged) {
    iconPath = path.join(basePath, 'app.asar', 'assets', 'icon.svg');
  }

  try {
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      console.error('Icon file not found for tray.');
      return;
    }
  } catch (error) {
    console.error('Failed to create tray:', error.message);
    return;
  }

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
  return [
    { id: 1, name: 'John Smith', status: 'available' },
    { id: 2, name: 'Jane Doe', status: 'busy' },
    { id: 3, name: 'Mike Johnson', status: 'offline' }
  ];
});

ipcMain.handle('update-agent-status', async (event, agentId, status) => {
  new Notification({
    title: 'Status Updated',
    body: `Agent ${agentId} is now ${status}`
  }).show();
  return { success: true };
});

ipcMain.handle('export-data', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'agents-export.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (!result.canceled) {
    const csv = data.map(agent => `${agent.name},${agent.status}`).join('\n');
    fs.writeFileSync(result.filePath, `Name,Status\n${csv}`);
    return { success: true, path: result.filePath };
  }

  return { success: false };
});

ipcMain.handle('api-call', async (event, url) => {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
      console.error(error.message);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(async () => {
  createWindow();

  // Auto-updater setup (เฉพาะ production)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      console.log('Update available');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded');
      autoUpdater.quitAndInstall();
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
