import { createMainWindow as createMainWindowFromModule } from '@/main-window';
import { app, protocol, ipcMain, BrowserWindow } from 'electron';
import { ensureConfigDir as ensureFrpsConfigDir, setupFrpsConfigHandlers } from './frps-config';
import { ensureConfigDir as ensureFrpcConfigDir, setupFrpcConfigHandlers } from './frpc-config';
import { setupHomeHandlers } from './home';
import { updateFrp } from './update-frp';
import { checkCurrentVersion, setupFrpManageHandlers } from './frp-manage';
import { setupProxyManageHandlers } from './proxy-manage';
import path from 'path';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
    },
  },
]);

// 确保在应用准备好时初始化配置
app.whenReady().then(async () => {
  try {
    // 首先确保配置目录和文件存在
    await ensureFrpsConfigDir();
    await ensureFrpcConfigDir();
    
    // 然后设置其他处理程序
    setupHomeHandlers();
    setupFrpsConfigHandlers();
    setupFrpcConfigHandlers();
    setupFrpManageHandlers();
    setupProxyManageHandlers();
    createMainWindowFromModule();
    updateFrp();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload/index.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  // 设置 global.mainWindow
  global.mainWindow = mainWindow;

  mainWindow.loadURL('http://localhost:8000');
};

// 确保在应用退出时清理
app.on('window-all-closed', () => {
  global.mainWindow = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 设置FRP版本检查处理程序
ipcMain.handle('check-frp-version', async () => {
  return checkCurrentVersion();
});
