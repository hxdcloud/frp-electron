import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// 存储FRP进程
let frpsProcess: ChildProcess | null = null;
let frpcProcess: ChildProcess | null = null;

// 获取FRP发布目录路径
export const getFrpReleasePath = () => {
  return path.join(app.getPath('home'), '.frp-electron', 'frp-release');
};

// 获取FRP配置文件路径
export const getFrpConfigPath = (type: 'frps' | 'frpc') => {
  const configDir = path.join(app.getPath('home'), '.frp-electron', `${type}-config`);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, `${type}.toml`);
};

// 获取当前版本文件路径
export const getCurrentVersionFilePath = () => {
  return path.join(getFrpReleasePath(), 'current-version');
};

// 获取指定版本的可执行文件路径
export const getExecutablePath = (version: string, executable: 'frps' | 'frpc') => {
  const platform = process.platform;
  const extension = platform === 'win32' ? '.exe' : '';
  return path.join(getFrpReleasePath(), version, `${executable}${extension}`);
};

// 检查版本号是否合法
const isValidVersion = (version: string): boolean => {
  // 版本号格式：v0.0.0 或 0.0.0
  const versionPattern = /^v?\d+\.\d+\.\d+$/;
  return versionPattern.test(version);
};

// 检查当前版本和可执行文件是否存在
export const checkCurrentVersion = (): {
  hasVersion: boolean;
  version: string | null;
  hasFrps: boolean;
  hasFrpc: boolean;
} => {
  try {
    // 检查版本文件是否存在
    const versionFilePath = getCurrentVersionFilePath();
    if (!fs.existsSync(versionFilePath)) {
      return {
        hasVersion: false,
        version: null,
        hasFrps: false,
        hasFrpc: false,
      };
    }

    // 读取版本号
    const version = fs.readFileSync(versionFilePath, 'utf-8').trim();
    if (!isValidVersion(version)) {
      return {
        hasVersion: false,
        version: null,
        hasFrps: false,
        hasFrpc: false,
      };
    }

    // 检查可执行文件是否存在
    const frpsPath = getExecutablePath(version, 'frps');
    const frpcPath = getExecutablePath(version, 'frpc');

    return {
      hasVersion: true,
      version,
      hasFrps: fs.existsSync(frpsPath),
      hasFrpc: fs.existsSync(frpcPath),
    };
  } catch (error) {
    console.error('检查FRP版本时出���:', error);
    return {
      hasVersion: false,
      version: null,
      hasFrps: false,
      hasFrpc: false,
    };
  }
};

// 启动FRPS服务
export const startFrps = async (): Promise<boolean> => {
  try {
    console.log('尝试启动FRPS服务');
    if (frpsProcess) {
      console.log('FRPS服务已经在运行');
      return true; // 已经在运行
    }

    const versionInfo = checkCurrentVersion();
    if (!versionInfo.hasVersion || !versionInfo.hasFrps) {
      console.error('FRPS可执行文件不存在');
      throw new Error('FRPS可执行文件不存在');
    }

    const execPath = getExecutablePath(versionInfo.version!, 'frps');
    const configPath = getFrpConfigPath('frps');
    
    if (!fs.existsSync(configPath)) {
      console.error('FRPS配置文件不存在:', configPath);
      throw new Error('FRPS配置文件不存在');
    }

    console.log('FRPS可执行文件路径:', execPath);
    console.log('FRPS配置文件路径:', configPath);

    frpsProcess = spawn(execPath, ['-c', configPath]);
    
    // 通知前端进程已启动
    global.mainWindow?.webContents.send('frps-status', { running: true, exitCode: null });

    // 处理输出
    frpsProcess.stdout?.on('data', (data) => {
      const log = data.toString();
      console.log('FRPS输出:', log);
      global.mainWindow?.webContents.send('frps-log', { type: 'info', message: log });
    });

    frpsProcess.stderr?.on('data', (data) => {
      const log = data.toString();
      console.error('FRPS错误输出:', log);
      global.mainWindow?.webContents.send('frps-log', { type: 'error', message: log });
    });

    // 处理进程退出
    frpsProcess.on('exit', (code) => {
      console.log('FRPS进程退出，退出代码:', code);
      global.mainWindow?.webContents.send('frps-status', { running: false, exitCode: code });
      frpsProcess = null;
    });

    // 处理进程错误
    frpsProcess.on('error', (err) => {
      console.error('FRPS进程错误:', err);
      global.mainWindow?.webContents.send('frps-log', { type: 'error', message: err.message });
      global.mainWindow?.webContents.send('frps-status', { running: false, exitCode: -1 });
      frpsProcess = null;
    });

    return true;
  } catch (error) {
    console.error('启动FRPS失败:', error);
    global.mainWindow?.webContents.send('frps-status', { running: false, exitCode: -1 });
    return false;
  }
};

// 启动FRPC服务
export const startFrpc = async (): Promise<boolean> => {
  try {
    console.log('尝试启动FRPC服务');
    if (frpcProcess) {
      console.log('FRPC服务已经在运行');
      return true; // 已经在运行
    }

    const versionInfo = checkCurrentVersion();
    if (!versionInfo.hasVersion || !versionInfo.hasFrpc) {
      console.error('FRPC可执行文件不存在');
      throw new Error('FRPC可执行文件不存在');
    }

    const execPath = getExecutablePath(versionInfo.version!, 'frpc');
    const configPath = getFrpConfigPath('frpc');

    if (!fs.existsSync(configPath)) {
      console.error('FRPC配置文件不存在:', configPath);
      throw new Error('FRPC配置文件不存在');
    }

    console.log('FRPC可执行文件路径:', execPath);
    console.log('FRPC配置文件路径:', configPath);

    frpcProcess = spawn(execPath, ['-c', configPath]);
    
    // 通知前端进程已启动
    global.mainWindow?.webContents.send('frpc-status', { running: true, exitCode: null });

    // 处理输出
    frpcProcess.stdout?.on('data', (data) => {
      const log = data.toString();
      console.log('FRPC输出:', log);
      global.mainWindow?.webContents.send('frpc-log', { type: 'info', message: log });
    });

    frpcProcess.stderr?.on('data', (data) => {
      const log = data.toString();
      console.error('FRPC错误输出:', log);
      global.mainWindow?.webContents.send('frpc-log', { type: 'error', message: log });
    });

    // 处理进程退出
    frpcProcess.on('exit', (code) => {
      console.log('FRPC进程退出，退出代码:', code);
      global.mainWindow?.webContents.send('frpc-status', { running: false, exitCode: code });
      frpcProcess = null;
    });

    // 处理进程错误
    frpcProcess.on('error', (err) => {
      console.error('FRPC进程错误:', err);
      global.mainWindow?.webContents.send('frpc-log', { type: 'error', message: err.message });
      global.mainWindow?.webContents.send('frpc-status', { running: false, exitCode: -1 });
      frpcProcess = null;
    });

    return true;
  } catch (error) {
    console.error('启动FRPC失败:', error);
    global.mainWindow?.webContents.send('frpc-status', { running: false, exitCode: -1 });
    return false;
  }
};

// 停止FRPS服务
export const stopFrps = async (): Promise<boolean> => {
  try {
    if (!frpsProcess) {
      return true; // 已经停止
    }

    frpsProcess.kill();
    frpsProcess = null;
    return true;
  } catch (error) {
    console.error('停止FRPS失败:', error);
    return false;
  }
};

// 停止FRPC服务
export const stopFrpc = async (): Promise<boolean> => {
  try {
    if (!frpcProcess) {
      return true; // 已经停止
    }

    frpcProcess.kill();
    frpcProcess = null;
    return true;
  } catch (error) {
    console.error('停止FRPC失败:', error);
    return false;
  }
};

// 获取FRPS运行状态
export const getFrpsStatus = (): boolean => {
  return frpsProcess !== null;
};

// 获取FRPC运行状态
export const getFrpcStatus = (): boolean => {
  return frpcProcess !== null;
};

// 设置IPC处理程序
export const setupFrpManageHandlers = () => {
  // 启动FRPS
  ipcMain.handle('start-frps', async () => {
    return startFrps();
  });

  // 启动FRPC
  ipcMain.handle('start-frpc', async () => {
    return startFrpc();
  });

  // 停止FRPS
  ipcMain.handle('stop-frps', async () => {
    return stopFrps();
  });

  // 停止FRPC
  ipcMain.handle('stop-frpc', async () => {
    return stopFrpc();
  });

  // 获取FRPS状态
  ipcMain.handle('get-frps-status', () => {
    return getFrpsStatus();
  });

  // 获取FRPC状态
  ipcMain.handle('get-frpc-status', () => {
    return getFrpcStatus();
  });
}; 