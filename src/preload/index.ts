import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

interface VersionInfo {
  versions: string | null;
  currentVersion: string | null;
}

interface FrpLog {
  type: 'info' | 'error';
  message: string;
}

interface FrpStatus {
  running: boolean;
  exitCode: number | null;
}

// 定义统一的 electronAPI 接口
const electronAPI = {
  // 版本相关
  versions: process.versions,
  platform: process.platform,
  arch: process.arch,
  
  // 文件下载相关
  downloadFile: (url: string) => ipcRenderer.invoke('download-file', url),
  getDownloadUrl: (version: string) => ipcRenderer.invoke('get-download-url', version),
  showDownloadPath: () => ipcRenderer.invoke('show-download-path'),
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
    return () => {
      ipcRenderer.removeListener('download-progress', callback);
    };
  },
  onExtractProgress: (callback: (progress: number) => void) => {
    const listener = (_event: IpcRendererEvent, progress: number) => callback(progress);
    ipcRenderer.on('extract-progress', listener);
    return () => {
      ipcRenderer.removeListener('extract-progress', listener);
    };
  },
  
  // FRP 版本管理
  getFrpVersion: () => ipcRenderer.invoke('get-frp-version') as Promise<VersionInfo>,
  setCurrentVersion: (version: string) => ipcRenderer.invoke('set-current-version', version),
  
  // Frps 配置和控制
  readFrpsConfig: () => ipcRenderer.invoke('read-frps-config'),
  saveFrpsConfig: (config: any) => ipcRenderer.invoke('save-frps-config', config),
  startFrps: (configPath: string) => ipcRenderer.invoke('start-frps', configPath),
  stopFrps: () => ipcRenderer.invoke('stop-frps'),
  getFrpsStatus: () => ipcRenderer.invoke('get-frps-status'),
  onFrpsLog: (callback: (log: FrpLog) => void) => {
    ipcRenderer.on('frps-log', (_event, log) => callback(log));
    return () => {
      ipcRenderer.removeListener('frps-log', callback);
    };
  },
  onFrpsStatus: (callback: (status: FrpStatus) => void) => {
    ipcRenderer.on('frps-status', (_event, status) => callback(status));
    return () => {
      ipcRenderer.removeListener('frps-status', callback);
    };
  },
  
  // Frpc 配置和控制
  readFrpcConfig: () => ipcRenderer.invoke('read-frpc-config'),
  saveFrpcConfig: (config: any) => ipcRenderer.invoke('save-frpc-config', config),
  startFrpc: (configPath: string) => ipcRenderer.invoke('start-frpc', configPath),
  stopFrpc: () => ipcRenderer.invoke('stop-frpc'),
  getFrpcStatus: () => ipcRenderer.invoke('get-frpc-status'),
  onFrpcLog: (callback: (log: FrpLog) => void) => {
    ipcRenderer.on('frpc-log', (_event, log) => callback(log));
    return () => {
      ipcRenderer.removeListener('frpc-log', callback);
    };
  },
  onFrpcStatus: (callback: (status: FrpStatus) => void) => {
    ipcRenderer.on('frpc-status', (_event, status) => callback(status));
    return () => {
      ipcRenderer.removeListener('frpc-status', callback);
    };
  },
  
  // 添加检查FRP版本的方法
  checkFrpVersion: () => ipcRenderer.invoke('check-frp-version'),
};

// 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 为 TypeScript 添加类型声明
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
