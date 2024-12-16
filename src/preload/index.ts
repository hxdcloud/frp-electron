import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const apiKey = 'electronAPI';

interface VersionInfo {
  versions: string | null;
  currentVersion: string | null;
}

interface SystemInfo {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  load: number[];
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  connections: {
    tcp: number;
    udp: number;
  };
}

const api: any = {
  versions: process.versions,
  platform: process.platform,
  arch: process.arch,
  downloadFile: (url: string) => ipcRenderer.invoke('download-file', url),
  showDownloadPath: () => ipcRenderer.invoke('show-download-path'),
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) =>
      callback(progress),
    );
    return () => {
      ipcRenderer.removeListener('download-progress', callback);
    };
  },
  onExtractProgress: (callback: (progress: number) => void) => {
    const listener = (_event: IpcRendererEvent, progress: number) =>
      callback(progress);
    ipcRenderer.on('extract-progress', listener);
    return () => {
      ipcRenderer.removeListener('extract-progress', listener);
    };
  },
  getFrpVersion: () =>
    ipcRenderer.invoke('get-frp-version') as Promise<VersionInfo>,
  setCurrentVersion: (version: string) =>
    ipcRenderer.invoke('set-current-version', version),
  getSystemInfo: () =>
    ipcRenderer.invoke('get-system-info') as Promise<SystemInfo>,
  subscribeSystemInfo: (callback: (info: SystemInfo) => void) => {
    const listener = (_event: IpcRendererEvent, info: SystemInfo) =>
      callback(info);
    ipcRenderer.on('system-info-update', listener);
    return () => {
      ipcRenderer.removeListener('system-info-update', listener);
    };
  },
  readFrpsConfig: () => ipcRenderer.invoke('read-frps-config'),
  saveFrpsConfig: (config: any) =>
    ipcRenderer.invoke('save-frps-config', config),
};

contextBridge.exposeInMainWorld(apiKey, api);

export type ElectronAPI = typeof api;
