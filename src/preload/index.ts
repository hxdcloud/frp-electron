import { contextBridge, ipcRenderer } from 'electron';

const apiKey = 'electronAPI';

const api: any = {
  versions: process.versions,
  platform: process.platform,
  arch: process.arch,
  downloadFile: (url: string) => ipcRenderer.send('download-release', url),
};

contextBridge.exposeInMainWorld(apiKey, api);
