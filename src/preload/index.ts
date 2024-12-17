import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

interface VersionInfo {
  versions: string | null;
  currentVersion: string | null;
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
  startFrps: () => ipcRenderer.invoke('start-frps'),
  stopFrps: () => ipcRenderer.invoke('stop-frps'),
  
  // Frpc 配置和控制
  readFrpcConfig: () => ipcRenderer.invoke('read-frpc-config'),
  saveFrpcConfig: (config: any) => ipcRenderer.invoke('save-frpc-config', config),
  startFrpc: () => ipcRenderer.invoke('start-frpc'),
  stopFrpc: () => ipcRenderer.invoke('stop-frpc'),
  
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
