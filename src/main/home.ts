import { ipcMain } from 'electron';

declare global {
  namespace NodeJS {
    interface Global {
      mainWindow: Electron.BrowserWindow | null;
      [key: string]: any;
    }
  }
}

export function setupHomeHandlers() {
  // 保留空函数以备后续添加其他处理程序
}
