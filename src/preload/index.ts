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

interface ProxyConfig {
  name: string;
  type: string;
  localPort: number;
  remotePort?: number;
  // 可以根据需要添加其他字段
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
  readFrpsConfigFile: () => ipcRenderer.invoke('read-frps-config-file'),
  saveFrpsConfig: (config: any) => ipcRenderer.invoke('save-frps-config', config),
  startFrps: () => ipcRenderer.invoke('start-frps'),
  stopFrps: () => ipcRenderer.invoke('stop-frps'),
  getFrpsStatus: () => ipcRenderer.invoke('get-frps-status') as Promise<boolean>,
  onFrpsLog: (callback: (log: FrpLog) => void) => {
    const listener = (_event: IpcRendererEvent, log: FrpLog) => callback(log);
    ipcRenderer.on('frps-log', listener);
    return () => {
      ipcRenderer.removeListener('frps-log', listener);
    };
  },
  onFrpsStatus: (callback: (status: FrpStatus) => void) => {
    const listener = (_event: IpcRendererEvent, status: FrpStatus) => callback(status);
    ipcRenderer.on('frps-status', listener);
    return () => {
      ipcRenderer.removeListener('frps-status', listener);
    };
  },
  
  // Frpc 配置和控制
  readFrpcConfig: () => ipcRenderer.invoke('read-frpc-config'),
  readFrpcConfigFile: () => ipcRenderer.invoke('read-frpc-config-file'),
  saveFrpcConfig: (config: any) => ipcRenderer.invoke('save-frpc-config', config),
  startFrpc: () => ipcRenderer.invoke('start-frpc'),
  stopFrpc: () => ipcRenderer.invoke('stop-frpc'),
  getFrpcStatus: () => ipcRenderer.invoke('get-frpc-status') as Promise<boolean>,
  onFrpcLog: (callback: (log: FrpLog) => void) => {
    const listener = (_event: IpcRendererEvent, log: FrpLog) => callback(log);
    ipcRenderer.on('frpc-log', listener);
    return () => {
      ipcRenderer.removeListener('frpc-log', listener);
    };
  },
  onFrpcStatus: (callback: (status: FrpStatus) => void) => {
    const listener = (_event: IpcRendererEvent, status: FrpStatus) => callback(status);
    ipcRenderer.on('frpc-status', listener);
    return () => {
      ipcRenderer.removeListener('frpc-status', listener);
    };
  },
  
  // 添加检查FRP版本的方法
  checkFrpVersion: () => ipcRenderer.invoke('check-frp-version'),
  
  // 代理管理相关
  getProxyList: () => ipcRenderer.invoke('get-proxy-list') as Promise<ProxyConfig[]>,
  getProxyConfig: (name: string) => ipcRenderer.invoke('get-proxy-config', name),
  addProxy: (config: any) => ipcRenderer.invoke('add-proxy', config),
  updateProxy: (name: string, config: any) => ipcRenderer.invoke('update-proxy', name, config),
  deleteProxy: (name: string) => ipcRenderer.invoke('delete-proxy', name),
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
